import fs from 'node:fs';

const apiVersion = '2022-11-28';

class GitHubError extends Error {
  constructor(message, status, responseBody) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function optionalEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

function positiveIntegerEnv(name, fallback) {
  const raw = optionalEnv(name, fallback);
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new Error(`${name} must be a positive integer, got "${raw}"`);
  }
  return Number.parseInt(raw, 10);
}

function appendOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function github(method, path, body) {
  const repo = requiredEnv('GITHUB_REPOSITORY');
  const token = requiredEnv('GH_TOKEN');
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-github-api-version': apiVersion,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new GitHubError(`${method} ${path} failed with ${response.status}: ${text}`, response.status, text);
  }

  return text ? JSON.parse(text) : null;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt) {
  const baseDelay = Math.min(15_000, 2 ** (attempt - 1) * 1000);
  return baseDelay + Math.floor(Math.random() * 250);
}

async function commitFiles() {
  const files = requiredEnv('COMMIT_FILES')
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);

  if (files.length === 0) {
    throw new Error('COMMIT_FILES must contain at least one path');
  }

  const entries = [];
  for (const path of files) {
    const blob = await github('POST', '/git/blobs', {
      content: fs.readFileSync(path, 'utf8'),
      encoding: 'utf-8',
    });

    entries.push({
      path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  return entries;
}

async function updateRef(refMode, targetBranch, commitSha) {
  const ref = `refs/heads/${targetBranch}`;

  if (refMode === 'create') {
    await github('POST', '/git/refs', {
      ref,
      sha: commitSha,
    });
    return ref;
  }

  const maxAttempts = positiveIntegerEnv('REF_UPDATE_ATTEMPTS', '3');
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await github('PATCH', `/git/refs/heads/${targetBranch}`, {
        sha: commitSha,
        force: false,
      });
      return ref;
    } catch (error) {
      const retryable = error instanceof GitHubError && error.status >= 500 && error.status < 600;
      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = retryDelayMs(attempt);
      console.warn(
        `Ref update failed with ${error.status}: ${error.responseBody}; retrying in ${delay}ms (${attempt}/${maxAttempts})`,
      );
      await sleep(delay);
    }
  }

  throw new Error(`Failed to update ${ref}`);
}

const baseSha = requiredEnv('BASE_SHA');
const targetBranch = requiredEnv('TARGET_BRANCH');
const refMode = requiredEnv('REF_MODE');
const message = requiredEnv('COMMIT_MESSAGE');

if (!['create', 'update'].includes(refMode)) {
  throw new Error(`REF_MODE must be create or update, got ${refMode}`);
}

const baseCommit = await github('GET', `/git/commits/${baseSha}`);
const tree = await github('POST', '/git/trees', {
  base_tree: baseCommit.tree.sha,
  tree: await commitFiles(),
});

const commit = await github('POST', '/git/commits', {
  message,
  tree: tree.sha,
  parents: [baseSha],
});

if (!commit.verification?.verified) {
  const reason = commit.verification?.reason || 'unknown';
  throw new Error(`GitHub did not verify the release bot commit (${reason})`);
}

const ref = await updateRef(refMode, targetBranch, commit.sha);

appendOutput('commit_sha', commit.sha);
appendOutput('verification_reason', commit.verification.reason || '');
appendOutput('branch_ref', ref);

console.log(`Created verified GitHub App commit ${commit.sha} on ${ref}`);
console.log(`Verification reason: ${commit.verification.reason || 'unknown'}`);
const summary = optionalEnv('COMMIT_SUMMARY');
if (summary) {
  console.log(summary);
}
