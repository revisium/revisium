#!/usr/bin/env node

const { resolve } = require('node:path');
const { spawn } = require('node:child_process');

const packageRoot = resolve(__dirname, '..');

const child = spawn(
  process.execPath,
  [
    '--experimental-require-module',
    resolve(packageRoot, 'dist/standalone.js'),
    ...process.argv.slice(2),
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
