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

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function assertEqual(label, actual, expected) {
  console.log(`${label}: ${actual}`);
  if (actual !== expected) {
    throw new Error(`${label} mismatch: ${actual} != ${expected}`);
  }
}

function versionFromJson(path) {
  const doc = readJson(path);
  if (doc.info && typeof doc.info === 'object' && 'version' in doc.info) {
    return doc.info.version;
  }
  return doc.version;
}

const version = requiredEnv('TARGET_VERSION');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');

assertEqual('package.json version', pkg.version, version);
assertEqual('package-lock.json version', lock.version, version);
assertEqual('package-lock root version', lock.packages?.['']?.version, version);

for (const file of versionFiles()) {
  assertEqual(`${file} version`, versionFromJson(file), version);
}

console.log(`tag version: ${version}`);
