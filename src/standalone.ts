#!/usr/bin/env node

import { createConnection, createServer } from 'node:net';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { initSwagger } from '@revisium/core';

interface EmbeddedPostgresInstance {
  initialise(): Promise<void>;
  start(): Promise<void>;
  createDatabase(databaseName: string): Promise<void>;
  stop(): Promise<void>;
}

let pgInstance: EmbeddedPostgresInstance | null = null;
let isShuttingDown = false;
let shutdownHandler: ((exitCode?: number) => Promise<void>) | null = null;

const DEFAULT_PORT = 9222;
const DEFAULT_PG_PORT = 5440;
const POSTGRES_READY_TIMEOUT_MS = 30_000;
const POSTGRES_READY_POLL_MS = 200;

interface StandaloneArgs {
  port: number;
  portExplicit: boolean;
  pgPort?: number;
  dataDir: string;
  auth: boolean;
  help: boolean;
}

function nextArg(argv: string[], i: number, flag: string): string {
  const value = argv[i + 1];
  if (!value || value.startsWith('-')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parsePort(value: string, flag: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `${flag} must be a valid port number (1-65535), got "${value}"`,
    );
  }
  return port;
}

function parseArgs(argv: string[]): StandaloneArgs {
  const args: StandaloneArgs = {
    port: DEFAULT_PORT,
    portExplicit: false,
    dataDir: resolve(homedir(), '.revisium'),
    auth: false,
    help: false,
  };

  const tokens = argv.slice(2);
  let idx = 0;

  while (idx < tokens.length) {
    const token = tokens[idx];

    switch (token) {
      case '-h':
      case '--help':
        args.help = true;
        idx++;
        break;
      case '--port':
        args.port = parsePort(nextArg(tokens, idx, '--port'), '--port');
        args.portExplicit = true;
        idx += 2;
        break;
      case '--pg-port':
        args.pgPort = parsePort(nextArg(tokens, idx, '--pg-port'), '--pg-port');
        idx += 2;
        break;
      case '--data':
        args.dataDir = resolve(nextArg(tokens, idx, '--data'));
        idx += 2;
        break;
      case '--auth':
        args.auth = true;
        idx++;
        break;
      default:
        if (token.startsWith('-')) {
          throw new Error(
            `Unknown option: ${token}. Run with --help for usage.`,
          );
        }
        throw new Error(
          `Unexpected argument: ${token}. Run with --help for usage.`,
        );
    }
  }

  return args;
}

function hasCompleteS3Config(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
    process.env.S3_REGION &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY,
  );
}

function appendUrlPath(baseUrl: string, path: string): string {
  let normalizedBaseUrl = baseUrl;
  while (normalizedBaseUrl.endsWith('/')) {
    normalizedBaseUrl = normalizedBaseUrl.slice(0, -1);
  }
  return `${normalizedBaseUrl}${path}`;
}

function isExpectedPostgresShutdownError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '57P01'
  );
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code !== 'ESRCH'
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function canConnectToPort(port: number): Promise<boolean> {
  return new Promise((resolveConnect) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    let settled = false;

    const finish = (isReady: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolveConnect(isReady);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForExistingPostgres(
  pid: number,
  port: number,
  timeoutMs = POSTGRES_READY_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    if (!isProcessRunning(pid)) {
      throw new Error(
        `PostgreSQL process ${pid} stopped before accepting connections.`,
      );
    }

    if (await canConnectToPort(port)) {
      return;
    }

    await delay(POSTGRES_READY_POLL_MS);
  }

  throw new Error(
    `PostgreSQL process ${pid} did not accept connections on port ${port} within ${timeoutMs}ms. Wait for it to finish starting, stop it, or pass --data to use a different data directory.`,
  );
}

function handleProcessError(error: unknown): void {
  if (isShuttingDown) {
    if (isExpectedPostgresShutdownError(error)) {
      return;
    }
    console.error('Unhandled standalone error during shutdown:', error);
    process.exit(1);
  }

  console.error('Unhandled standalone error:', error);
  if (shutdownHandler) {
    void shutdownHandler(1);
    return;
  }
  if (pgInstance) {
    isShuttingDown = true;
    void pgInstance.stop().finally(() => process.exit(1));
    return;
  }
  process.exit(1);
}

function formatStartupError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error === undefined || error === null) {
    return 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'number' ||
    typeof error === 'boolean' ||
    typeof error === 'bigint' ||
    typeof error === 'symbol'
  ) {
    return String(error);
  }

  if (typeof error === 'function') {
    return error.name ? `[function ${error.name}]` : '[function]';
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized) {
      return serialized;
    }
  } catch {
    return Object.prototype.toString.call(error);
  }

  return Object.prototype.toString.call(error);
}

function ensurePrivateDataDir(dataDir: string): void {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  chmodSync(dataDir, 0o700);
}

function readOrCreateJwtSecret(dataDir: string): string {
  const secretPath = resolve(dataDir, 'jwt-secret');
  ensurePrivateDataDir(dataDir);

  if (existsSync(secretPath)) {
    const secret = readFileSync(secretPath, 'utf8').trim();
    if (secret) {
      chmodSync(secretPath, 0o600);
      return secret;
    }
  }

  const secret = randomBytes(32).toString('base64url');
  writeFileSync(secretPath, `${secret}\n`, { mode: 0o600 });
  return secret;
}

function readActivePostgresLock(
  pgDataDir: string,
): { pid: number; port?: number } | null {
  const lockPath = resolve(pgDataDir, 'postmaster.pid');

  if (!existsSync(lockPath)) {
    return null;
  }

  let lines: string[];

  try {
    lines = readFileSync(lockPath, 'utf8').split(/\r?\n/);
  } catch {
    return null;
  }

  const [pidLine, , , portLine] = lines;
  const pid = Number.parseInt(pidLine ?? '', 10);

  if (!Number.isInteger(pid) || pid <= 0 || !isProcessRunning(pid)) {
    return null;
  }

  const port = Number.parseInt(portLine ?? '', 10);

  return {
    pid,
    port: Number.isInteger(port) && port > 0 ? port : undefined,
  };
}

function resolveExistingPostgresPort(
  args: StandaloneArgs,
  lock: { pid: number; port?: number },
): number {
  if (!lock.port) {
    throw new Error(
      `PostgreSQL data directory is already in use by process ${lock.pid}, but its port could not be read from postmaster.pid. Stop the existing process, or pass --data to use a different data directory.`,
    );
  }

  if (args.pgPort !== undefined && args.pgPort !== lock.port) {
    throw new Error(
      `--pg-port ${args.pgPort} does not match the PostgreSQL process already using this data directory on port ${lock.port}. Omit --pg-port or pass ${lock.port}.`,
    );
  }

  return lock.port;
}

function applyRuntimeEnv(args: StandaloneArgs, databaseUrl: string): void {
  const setEnvIfUnset = (key: string, value: string) => {
    process.env[key] = process.env[key] || value;
  };

  process.env.DATABASE_URL = databaseUrl;
  process.env.PORT = String(args.port);
  setEnvIfUnset('PUBLIC_URL', `http://localhost:${args.port}`);
  setEnvIfUnset('CACHE_ENABLED', '1');
  setEnvIfUnset('REVISIUM_STANDALONE', '1');

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = readOrCreateJwtSecret(args.dataDir);
  }

  setEnvIfUnset('STORAGE_PROVIDER', hasCompleteS3Config() ? 's3' : 'local');

  if (process.env.STORAGE_PROVIDER === 'local') {
    setEnvIfUnset('STORAGE_LOCAL_PATH', resolve(args.dataDir, 'uploads'));
    setEnvIfUnset(
      'FILE_PLUGIN_PUBLIC_ENDPOINT',
      appendUrlPath(process.env.PUBLIC_URL, '/files'),
    );
  }

  if (args.auth) {
    process.env.REVISIUM_NO_AUTH = 'false';
  } else {
    process.env.REVISIUM_NO_AUTH = 'true';
  }
}

function printHelp(): void {
  console.log(`Revisium Standalone

Usage:
  npx @revisium/standalone@latest [options]

Options:
  --port <number>     Fixed HTTP server port (default: first free port from ${DEFAULT_PORT})
  --pg-port <number>  Fixed embedded PostgreSQL port (default: first free port from ${DEFAULT_PG_PORT})
  --data <path>       Data directory (default: ~/.revisium)
  --auth              Enable authentication (default: disabled)
  -h, --help          Show this help

Environment:
  PUBLIC_URL                    Public base URL for OAuth, MCP, and file URLs
  STORAGE_PROVIDER              Storage backend: local or s3
  STORAGE_LOCAL_PATH            Local upload directory (default: <data>/uploads)
  FILE_PLUGIN_PUBLIC_ENDPOINT   Public file URL prefix
  S3_*                          S3 storage settings
  ADMIN_PASSWORD                Initial admin password with --auth (first run only)

See standalone/README.md and ENV.md for the complete env reference.`);
}

function isUnsupportedLoopbackHost(error: NodeJS.ErrnoException): boolean {
  return error.code === 'EADDRNOTAVAIL' || error.code === 'EAFNOSUPPORT';
}

function isPortAvailableOnHost(port: number, host?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (error: NodeJS.ErrnoException) => {
      resolve(host === '::1' && isUnsupportedLoopbackHost(error));
    });
    server.once('close', () => resolve(true));
    server.listen(host ? { port, host } : { port }, () => server.close());
  });
}

async function isPortAvailable(port: number): Promise<boolean> {
  const hosts = [undefined, '127.0.0.1', '::1'];

  for (const host of hosts) {
    if (!(await isPortAvailableOnHost(port, host))) {
      return false;
    }
  }

  return true;
}

async function checkPort(port: number): Promise<void> {
  if (!(await isPortAvailable(port))) {
    throw new Error(`Port ${port} is already in use`);
  }
}

async function resolveHttpPort(args: StandaloneArgs): Promise<number> {
  if (args.portExplicit) {
    await checkPort(args.port);
    return args.port;
  }

  for (let port = DEFAULT_PORT; port <= 65535; port++) {
    if (port === args.pgPort) {
      continue;
    }

    if (await isPortAvailable(port)) {
      if (port !== DEFAULT_PORT) {
        console.log(
          `HTTP port ${DEFAULT_PORT} is busy; using ${port} instead.`,
        );
      }
      return port;
    }
  }

  throw new Error(`No available HTTP port found starting from ${DEFAULT_PORT}`);
}

async function resolvePgPort(args: StandaloneArgs): Promise<number> {
  if (args.pgPort !== undefined) {
    if (args.pgPort === args.port) {
      throw new Error('--pg-port must be different from --port');
    }
    await checkPort(args.pgPort);
    return args.pgPort;
  }

  for (let port = DEFAULT_PG_PORT; port <= 65535; port++) {
    if (port === args.port) {
      continue;
    }

    if (await isPortAvailable(port)) {
      if (port !== DEFAULT_PG_PORT) {
        console.log(
          `PostgreSQL port ${DEFAULT_PG_PORT} is busy; using ${port} instead.`,
        );
      }
      return port;
    }
  }

  throw new Error(
    `No available PostgreSQL port found starting from ${DEFAULT_PG_PORT}`,
  );
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  let app: NestExpressApplication | null = null;
  let pg: EmbeddedPostgresInstance | null = null;

  const shutdown = async (exitCode = 0) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    console.log('\nShutting down...');
    if (app) {
      try {
        await app.close();
      } catch {
        // ignore close errors
      }
    }
    if (pg) {
      try {
        await pg.stop();
        pgInstance = null;
      } catch {
        // ignore stop errors
      }
    }
    process.exit(exitCode);
  };

  shutdownHandler = shutdown;

  process.on('SIGINT', () => {
    void shutdown(0);
  });
  process.on('SIGTERM', () => {
    void shutdown(0);
  });

  const pgDataDir = resolve(args.dataDir, 'pgdata');
  const existingPostgres = readActivePostgresLock(pgDataDir);
  let pgPort: number | undefined;

  if (existingPostgres) {
    pgPort = resolveExistingPostgresPort(args, existingPostgres);
    await waitForExistingPostgres(existingPostgres.pid, pgPort);
    args.pgPort = pgPort;
  }

  args.port = await resolveHttpPort(args);
  pgPort = pgPort ?? (await resolvePgPort(args));

  const isFirstRun = !existsSync(pgDataDir);

  if (existingPostgres) {
    console.log(
      `Using existing PostgreSQL process ${existingPostgres.pid} on port ${pgPort}`,
    );
  } else {
    console.log(
      isFirstRun
        ? 'First run detected — initializing PostgreSQL...'
        : 'Starting PostgreSQL...',
    );

    // @ts-expect-error embedded-postgres is ESM-only, resolved at runtime with --experimental-require-module
    const { default: EmbeddedPostgres } = await import('embedded-postgres');

    pg = new EmbeddedPostgres({
      databaseDir: pgDataDir,
      port: pgPort,
      user: 'revisium',
      password: 'password',
      persistent: true,
    });
    pgInstance = pg;

    if (isFirstRun) {
      await pg.initialise();
    }
    await pg.start();

    if (isFirstRun) {
      await pg.createDatabase('revisium');
    }

    console.log(`PostgreSQL running on port ${pgPort}`);
  }

  const DATABASE_URL = `postgresql://revisium:password@localhost:${pgPort}/revisium?schema=public`;
  applyRuntimeEnv(args, DATABASE_URL);

  const packageRoot = resolve(__dirname, '..');
  const seedPath = resolve(packageRoot, 'prisma/seed.js');
  const prismaPath = resolve(
    require.resolve('prisma/package.json'),
    '..',
    'build',
    'index.js',
  );

  console.log('Running database migrations...');
  execFileSync(process.execPath, [prismaPath, 'migrate', 'deploy'], {
    cwd: packageRoot,
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });

  console.log('Running seed...');
  execFileSync(process.execPath, ['--experimental-require-module', seedPath], {
    cwd: packageRoot,
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });

  process.env.REVISIUM_CLIENT_DIR = resolve(packageRoot, 'client');
  process.env.REVISIUM_TEMPLATES_DIR = resolve(packageRoot, 'templates');

  console.log('Starting Revisium...');

  const { AppModule } = await import('./app.module');

  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true,
    }),
  });

  const config = app.get(ConfigService);
  const bodyLimit = config.get('BODY_LIMIT') ?? '10mb';

  app.useBodyParser('json', { limit: bodyLimit });
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  initSwagger(app);

  await app.startAllMicroservices();
  await app.listen(args.port);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require(resolve(packageRoot, 'package.json'));
  const deps = pkg.dependencies || {};

  setTimeout(() => {
    console.log('');
    console.log(`Revisium Standalone v${pkg.version}`);
    console.log(
      `  core: ${pkg.revisiumCore || deps['@revisium/core'] || '?'}, endpoint: ${pkg.revisiumEndpoint || deps['@revisium/endpoint'] || '?'}, admin: ${pkg.revisiumAdmin || deps['@revisium/admin'] || '?'}`,
    );
    console.log('');
    console.log(`  URL:            http://localhost:${args.port}`);
    console.log(`  REST API:       http://localhost:${args.port}/api`);
    console.log(`  Data directory: ${args.dataDir}`);
    const storageInfo =
      process.env.STORAGE_PROVIDER === 'local'
        ? process.env.STORAGE_PROVIDER +
          ' (' +
          process.env.STORAGE_LOCAL_PATH +
          ')'
        : process.env.STORAGE_PROVIDER;
    console.log(`  File storage:   ${storageInfo}`);
    if (args.auth) {
      const passwordHint = process.env.ADMIN_PASSWORD
        ? 'ADMIN_PASSWORD'
        : 'admin';
      console.log(
        `  Auth:           enabled (user: admin, initial password: ${passwordHint})`,
      );
    } else {
      console.log('  Auth:           disabled (use --auth to enable)');
    }
    console.log('');
  }, 2000);
}

process.on('uncaughtException', handleProcessError);
process.on('unhandledRejection', handleProcessError);

main().catch(async (error) => {
  console.error('Failed to start Revisium:', formatStartupError(error));
  if (shutdownHandler && !isShuttingDown) {
    await shutdownHandler(1);
    return;
  }
  if (pgInstance) {
    try {
      await pgInstance.stop();
      pgInstance = null;
    } catch {
      // ignore stop errors during cleanup
    }
  }
  process.exit(1);
});
