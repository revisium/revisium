#!/usr/bin/env node

import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initSwagger } from '@revisium/core';
import { AppModule } from './app.module';

let pgInstance: { stop(): Promise<void> } | null = null;

interface StandaloneArgs {
  port: number;
  pgPort: number;
  dataDir: string;
  auth: boolean;
}

function nextArg(argv: string[], i: number, flag: string): string {
  const value = argv[i + 1];
  if (!value || value.startsWith('--')) {
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
    port: 9222,
    pgPort: 5440,
    dataDir: resolve(homedir(), '.revisium'),
    auth: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--port':
        args.port = parsePort(nextArg(argv, i, '--port'), '--port');
        i++;
        break;
      case '--pg-port':
        args.pgPort = parsePort(nextArg(argv, i, '--pg-port'), '--pg-port');
        i++;
        break;
      case '--data':
        args.dataDir = resolve(nextArg(argv, i, '--data'));
        i++;
        break;
      case '--auth':
        args.auth = true;
        break;
    }
  }

  return args;
}

function checkPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () =>
      reject(new Error(`Port ${port} is already in use`)),
    );
    server.listen(port, () => server.close(() => resolve()));
  });
}

async function main() {
  const args = parseArgs(process.argv);

  await checkPort(args.port);
  await checkPort(args.pgPort);

  const pgDataDir = resolve(args.dataDir, 'pgdata');
  const isFirstRun = !existsSync(pgDataDir);

  console.log(
    isFirstRun
      ? 'First run detected — initializing PostgreSQL...'
      : 'Starting PostgreSQL...',
  );

  // @ts-expect-error embedded-postgres is ESM-only, resolved at runtime with --experimental-require-module
  const { default: EmbeddedPostgres } = await import('embedded-postgres');

  const pg = new EmbeddedPostgres({
    databaseDir: pgDataDir,
    port: args.pgPort,
    user: 'revisium',
    password: 'password',
    persistent: true,
  });

  if (isFirstRun) {
    await pg.initialise();
  }
  await pg.start();
  pgInstance = pg;

  if (isFirstRun) {
    await pg.createDatabase('revisium');
  }

  console.log(`PostgreSQL running on port ${args.pgPort}`);

  const DATABASE_URL = `postgresql://revisium:password@localhost:${args.pgPort}/revisium?schema=public`;
  process.env.DATABASE_URL = DATABASE_URL;

  const packageRoot = resolve(__dirname, '..');
  const seedPath = resolve(packageRoot, 'prisma/seed.js');
  const prismaPath = resolve(
    require.resolve('prisma/package.json'),
    '..',
    'build',
    'index.js',
  );

  console.log('Running database migrations...');
  execSync(`node "${prismaPath}" migrate deploy`, {
    cwd: packageRoot,
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });

  console.log('Running seed...');
  execSync(`node --experimental-require-module "${seedPath}"`, {
    cwd: packageRoot,
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });

  process.env.PORT = String(args.port);
  process.env.CACHE_ENABLED = process.env.CACHE_ENABLED ?? '1';
  if (!args.auth) {
    process.env.REVISIUM_NO_AUTH = 'true';
  }

  process.env.REVISIUM_CLIENT_DIR = resolve(packageRoot, 'client');
  process.env.REVISIUM_TEMPLATES_DIR = resolve(packageRoot, 'templates');

  console.log('Starting Revisium...');

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true,
    }),
  });

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
    if (args.auth) {
      console.log('  Auth:           enabled (admin/admin)');
    } else {
      console.log('  Auth:           disabled (use --auth to enable)');
    }
    console.log('');
  }, 2000);

  const shutdown = async () => {
    console.log('\nShutting down...');
    try {
      await app.close();
    } catch {
      // ignore close errors
    }
    try {
      await pg.stop();
    } catch {
      // ignore stop errors
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(async (error) => {
  console.error('Failed to start Revisium:', error);
  if (pgInstance) {
    try {
      await pgInstance.stop();
    } catch {
      // ignore stop errors during cleanup
    }
  }
  process.exit(1);
});
