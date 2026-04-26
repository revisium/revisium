import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function versionFiles() {
  return (process.env.VERSION_FILES || '')
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function updateJsonVersion(path, version) {
  const doc = JSON.parse(fs.readFileSync(path, 'utf8'));

  if (doc.info && typeof doc.info === 'object' && 'version' in doc.info) {
    doc.info.version = version;
  } else if ('version' in doc) {
    doc.version = version;
  } else {
    throw new Error(`${path} does not contain info.version or version`);
  }

  fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
}

const version = requiredEnv('TARGET_VERSION');

execFileSync('npm', ['version', version, '--no-git-tag-version', '--allow-same-version'], {
  stdio: 'inherit',
});

for (const file of versionFiles()) {
  updateJsonVersion(file, version);
}
