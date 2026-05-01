#!/usr/bin/env bash
set -euo pipefail

find_free_port() {
  node -e "
    const net = require('node:net');
    const hosts = [undefined, '127.0.0.1', '::1'];
    const isUnsupportedLoopbackHost = (error) => error.code === 'EADDRNOTAVAIL' || error.code === 'EAFNOSUPPORT';
    const isPortAvailableOnHost = (port, host) => new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (error) => {
        resolve(host === '::1' && isUnsupportedLoopbackHost(error));
      });
      server.once('close', () => resolve(true));
      server.listen(host ? { port, host } : { port }, () => server.close());
    });

    (async () => {
      for (let port = 9222; port <= 65535; port += 1) {
        let available = true;
        for (const host of hosts) {
          if (!(await isPortAvailableOnHost(port, host))) {
            available = false;
            break;
          }
        }
        if (available) {
          process.stdout.write(String(port));
          return;
        }
      }
      process.exit(1);
    })().catch(() => process.exit(1));
  "
}

PORT="${PORT:-$(find_free_port)}"
BASE_URL="http://localhost:${PORT}"
TIMEOUT=120
ORG=admin
JSON_CONTENT_TYPE="Content-Type: application/json"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

TEMP_DIR=$(mktemp -d)
DATA_DIR=$(mktemp -d)
SERVER_PID=""
SECOND_SERVER_PID=""
PG_PORT_LABEL="auto"

cleanup() {
  echo "--- Cleaning up ---"
  if [[ -n "$SECOND_SERVER_PID" ]]; then
    kill "$SECOND_SERVER_PID" 2>/dev/null || true
    wait "$SECOND_SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$TEMP_DIR" "$DATA_DIR"
  return 0
}
trap cleanup EXIT

echo "=== Standalone Smoke Test ==="
echo "  TEMP_DIR=$TEMP_DIR"
echo "  DATA_DIR=$DATA_DIR"

# 1. Pack the standalone package
echo "--- Packing standalone ---"
cd "${PROJECT_DIR}/standalone"
ls package.json > /dev/null
TARBALL=$(npm pack --pack-destination "$TEMP_DIR" | tail -1)
echo "Created: $TARBALL"

# 2. Install in temp directory
echo "--- Installing in temp dir ---"
cd "$TEMP_DIR"
npm init -y > /dev/null 2>&1
npm install "${TEMP_DIR}/${TARBALL}"
echo "Installed successfully"

# 3. Start the server
STANDALONE_ENV=(
  env
  -u JWT_SECRET
  -u PUBLIC_URL
  -u FILE_PLUGIN_PUBLIC_ENDPOINT
  -u STORAGE_PROVIDER
  -u STORAGE_LOCAL_PATH
  -u S3_ENDPOINT
  -u S3_REGION
  -u S3_BUCKET
  -u S3_ACCESS_KEY_ID
  -u S3_SECRET_ACCESS_KEY
)
START_CMD=(npx revisium-standalone --port "$PORT" --data "$DATA_DIR")
if [[ -n "${PG_PORT:-}" ]]; then
  if [[ "$PG_PORT" == "$PORT" ]]; then
    echo "FAIL: PG_PORT must be different from PORT"
    exit 1
  fi
  START_CMD+=(--pg-port "$PG_PORT")
  PG_PORT_LABEL="$PG_PORT"
fi
echo "--- Starting server (port=${PORT}, pg-port=${PG_PORT_LABEL}) ---"
"${STANDALONE_ENV[@]}" "${START_CMD[@]}" &
SERVER_PID=$!

# 4. Wait for the server to be ready
echo "--- Waiting for server (max ${TIMEOUT}s) ---"
ELAPSED=0
while ! curl -sf "${BASE_URL}/api" > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "FAIL: Server did not start within ${TIMEOUT}s"
    exit 1
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "FAIL: Server process died"
    exit 1
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done
echo "Server ready after ~${ELAPSED}s"

# 5. Run smoke tests
PASS=0
FAIL=0

SECOND_PORT=$(find_free_port)
SECOND_BASE_URL="http://localhost:${SECOND_PORT}"
echo "--- Starting second server with shared data (port=${SECOND_PORT}) ---"
"${STANDALONE_ENV[@]}" npx revisium-standalone --port "$SECOND_PORT" --data "$DATA_DIR" &
SECOND_SERVER_PID=$!

SECOND_ELAPSED=0
SECOND_READY=0
while [[ $SECOND_ELAPSED -lt $TIMEOUT ]]; do
  if curl -sf "${SECOND_BASE_URL}/api" > /dev/null 2>&1; then
    SECOND_READY=1
    break
  fi
  if ! kill -0 "$SECOND_SERVER_PID" 2>/dev/null; then
    break
  fi
  sleep 2
  SECOND_ELAPSED=$((SECOND_ELAPSED + 2))
done

if [[ $SECOND_READY -eq 1 ]]; then
  echo "  PASS: Second server reuses shared PostgreSQL data directory"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Second server did not start with shared data directory"
  FAIL=$((FAIL + 1))
fi

kill "$SECOND_SERVER_PID" 2>/dev/null || true
wait "$SECOND_SERVER_PID" 2>/dev/null || true
SECOND_SERVER_PID=""

json_extract() {
  local field="$1"
  node -e "
    const v = JSON.parse(require('fs').readFileSync(0,'utf8'))${field};
    if (v == null) process.exit(1);
    process.stdout.write(String(v));
  " 2>/dev/null
  return $?
}

assert_status() {
  local desc="$1" method="$2" url="$3" expected="$4"
  shift 4
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" "$@") || true
  if [[ "$status" == "$expected" ]]; then
    echo "  PASS: $desc (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (expected HTTP $expected, got $status)"
    FAIL=$((FAIL + 1))
  fi
  return 0
}

assert_json() {
  local desc="$1" expr="$2"
  shift 2
  local body
  body=$(curl -sf "$@") || { echo "  FAIL: $desc (curl failed)"; FAIL=$((FAIL + 1)); return 0; }
  local result
  result=$(echo "$body" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try { const v = ${expr}; console.log(v === true ? 'OK' : 'MISMATCH:' + JSON.stringify(v)); }
      catch(e) { console.log('ERROR:' + e.message); }
    });
  ") || result="NODE_ERROR"
  if [[ "$result" == "OK" ]]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc ($result)"
    echo "  Response: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
  return 0
}

assert_contains() {
  local desc="$1" substring="$2"
  shift 2
  local body
  body=$(curl -sf "$@") || { echo "  FAIL: $desc (curl failed)"; FAIL=$((FAIL + 1)); return 0; }
  if echo "$body" | grep -q "$substring"; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (response does not contain '$substring')"
    echo "  Response: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
  return 0
}

echo "--- Running tests ---"

if [[ -s "$DATA_DIR/jwt-secret" ]]; then
  echo "  PASS: JWT secret persisted in data directory"
  PASS=$((PASS + 1))
else
  echo "  FAIL: JWT secret was not persisted in data directory"
  FAIL=$((FAIL + 1))
fi

# Swagger docs
assert_status "GET /api returns 200" GET "${BASE_URL}/api" 200
assert_contains "GET /api contains swagger-ui.css" "swagger-ui.css" "${BASE_URL}/api"
assert_contains "GET /api contains swagger-ui-bundle.js" "swagger-ui-bundle.js" "${BASE_URL}/api"
assert_status "GET /api/swagger-ui.css returns 200" GET "${BASE_URL}/api/swagger-ui.css" 200
assert_status "GET /api/swagger-ui-bundle.js returns 200" GET "${BASE_URL}/api/swagger-ui-bundle.js" 200

# Create project
PROJECT_RESPONSE=$(curl -sf -X POST "${BASE_URL}/api/organization/${ORG}/projects" \
  -H "$JSON_CONTENT_TYPE" \
  -d '{"projectName":"smoke-test"}') || true
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | json_extract ".id") || PROJECT_ID=""
if [[ -n "$PROJECT_ID" ]]; then
  echo "  PASS: Create project (id=$PROJECT_ID)"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Create project (no id in response)"
  echo "  Response: $(echo "$PROJECT_RESPONSE" | head -c 200)"
  FAIL=$((FAIL + 1))
fi

# Get draft revision id
DRAFT_RESPONSE=$(curl -sf "${BASE_URL}/api/organization/${ORG}/projects/smoke-test/branches/master/draft-revision") || true
REVISION_ID=$(echo "$DRAFT_RESPONSE" | json_extract ".id") || REVISION_ID=""
if [[ -n "$REVISION_ID" ]]; then
  echo "  PASS: Get draft revision (id=$REVISION_ID)"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Get draft revision"
  echo "  Response: $(echo "$DRAFT_RESPONSE" | head -c 300)"
  FAIL=$((FAIL + 1))
fi

# Create table
assert_status "Create table" POST "${BASE_URL}/api/revision/${REVISION_ID}/tables" 201 \
  -H "$JSON_CONTENT_TYPE" \
  -d '{
    "tableId": "articles",
    "schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "default": "" },
        "body": { "type": "string", "default": "" }
      },
      "additionalProperties": false,
      "required": ["title", "body"]
    }
  }'

# Create row
assert_status "Create row" POST \
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/articles/create-row" 201 \
  -H "$JSON_CONTENT_TYPE" \
  -d '{
    "rowId": "article-1",
    "data": { "title": "Hello World", "body": "Smoke test content" }
  }'

# Read row and verify data
assert_json "Read row data" \
  "JSON.parse(d).data.title === 'Hello World'" \
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/articles/rows/article-1"

# File upload with standalone local storage
assert_status "Create file table" POST "${BASE_URL}/api/revision/${REVISION_ID}/tables" 201 \
  -H "$JSON_CONTENT_TYPE" \
  -d '{
    "tableId": "assets",
    "schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "default": "" },
        "file": { "$ref": "urn:jsonschema:io:revisium:file-schema:1.0.0" }
      },
      "additionalProperties": false,
      "required": ["title", "file"]
    }
  }'

FILE_ROW_RESPONSE=$(curl -sf -X POST \
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/assets/create-row" \
  -H "$JSON_CONTENT_TYPE" \
  -d '{
    "rowId": "asset-1",
    "data": {
      "title": "Upload smoke",
      "file": {
        "status": "",
        "fileId": "",
        "url": "",
        "fileName": "",
        "hash": "",
        "extension": "",
        "mimeType": "",
        "size": 0,
        "width": 0,
        "height": 0
      }
    }
  }') || true
FILE_ID=$(echo "$FILE_ROW_RESPONSE" | json_extract ".row.data.file.fileId") || FILE_ID=""
if [[ -n "$FILE_ID" ]]; then
  echo "  PASS: Create file row (fileId=$FILE_ID)"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Create file row (no fileId in response)"
  echo "  Response: $(echo "$FILE_ROW_RESPONSE" | head -c 300)"
  FAIL=$((FAIL + 1))
fi

UPLOAD_FILE="$TEMP_DIR/upload.txt"
printf "standalone upload smoke" > "$UPLOAD_FILE"
assert_status "Upload file to local storage" POST \
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/assets/rows/asset-1/upload/${FILE_ID}" 201 \
  -F "file=@${UPLOAD_FILE};type=text/plain"

FILE_ROW_AFTER_UPLOAD=$(curl -sf \
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/assets/rows/asset-1") || true
FILE_URL=$(echo "$FILE_ROW_AFTER_UPLOAD" | json_extract ".data.file.url") || FILE_URL=""
if [[ "$FILE_URL" == "${BASE_URL}/files/"* ]]; then
  echo "  PASS: Uploaded file exposes local URL"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Uploaded file URL (got '${FILE_URL:-<empty>}')"
  echo "  Response: $(echo "$FILE_ROW_AFTER_UPLOAD" | head -c 300)"
  FAIL=$((FAIL + 1))
fi

UPLOADED_BODY=$(curl -sf "$FILE_URL") || UPLOADED_BODY=""
if [[ "$UPLOADED_BODY" == "standalone upload smoke" ]]; then
  echo "  PASS: Uploaded file is served from local storage"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Uploaded file body mismatch"
  FAIL=$((FAIL + 1))
fi

# GraphQL
assert_json "GraphQL responds" \
  "JSON.parse(d).data.__typename === 'Query'" \
  -X POST "${BASE_URL}/graphql" \
  -H "$JSON_CONTENT_TYPE" \
  -d '{"query":"{ __typename }"}'

# Admin UI
assert_contains "Admin UI serves HTML" "<html" "${BASE_URL}/"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
