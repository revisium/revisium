#!/usr/bin/env node

const { resolve } = require('node:path');
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { createRequire } = require('node:module');

const packageRoot = resolve(__dirname, '..');
const args = process.argv.slice(2);

function printLocalRunHelp(message) {
  console.error(message);
  console.error('');
  console.error('This entrypoint runs the packaged standalone build.');
  console.error('From the repository root, install its runtime dependencies first:');
  console.error('');
  console.error('  npm run standalone:build');
  console.error('  npm --prefix standalone install --no-package-lock');
  console.error('  node standalone/bin/revisium-standalone.js');
  console.error('');
  console.error('For the full packaged smoke test, run:');
  console.error('');
  console.error('  bash scripts/standalone-smoke-test.sh');
}

function ensurePackagedRuntime(options = {}) {
  const bundlePath = resolve(packageRoot, 'dist/standalone.js');

  if (!existsSync(bundlePath)) {
    printLocalRunHelp('Missing standalone/dist/standalone.js.');
    process.exit(1);
  }

  if (options.skipDependencyCheck) {
    return;
  }

  let packageJson;
  try {
    packageJson = require(resolve(packageRoot, 'package.json'));
  } catch {
    return;
  }

  const bundleRequire = createRequire(bundlePath);
  const isResolvable = (dependency) => {
    try {
      bundleRequire.resolve(dependency);
      return true;
    } catch (error) {
      if (
        error.code !== 'MODULE_NOT_FOUND' &&
        error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED'
      ) {
        throw error;
      }
    }

    try {
      bundleRequire.resolve(`${dependency}/package.json`);
      return true;
    } catch (error) {
      if (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
        return true;
      }
      if (error.code === 'MODULE_NOT_FOUND') {
        return false;
      }
      throw error;
    }
  };

  const missing = Object.keys(packageJson.dependencies ?? {}).filter((dependency) => {
    return !isResolvable(dependency);
  });

  if (missing.length > 0) {
    printLocalRunHelp(`Missing standalone runtime dependencies: ${missing.join(', ')}`);
    process.exit(1);
  }
}

ensurePackagedRuntime({
  skipDependencyCheck: args.includes('--help') || args.includes('-h'),
});

const child = spawn(
  process.execPath,
  [
    '--experimental-require-module',
    resolve(packageRoot, 'dist/standalone.js'),
    ...args,
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      REVISIUM_STANDALONE: '1',
      REVISIUM_CLIENT_DIR: resolve(packageRoot, 'client'),
      REVISIUM_TEMPLATES_DIR: resolve(packageRoot, 'templates'),
    },
  },
);

child.on('exit', (code) => process.exit(code ?? 0));

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
