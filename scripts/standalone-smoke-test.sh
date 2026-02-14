#!/usr/bin/env bash
set -euo pipefail

PORT=9222
PG_PORT=5440
BASE_URL="http://localhost:${PORT}"
TIMEOUT=120
ORG=admin

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

TEMP_DIR=$(mktemp -d)
DATA_DIR=$(mktemp -d)
SERVER_PID=""

cleanup() {
  echo "--- Cleaning up ---"
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$TEMP_DIR" "$DATA_DIR"
}
trap cleanup EXIT

echo "=== Standalone Smoke Test ==="

# 1. Pack the standalone package
echo "--- Packing standalone ---"
cd "${PROJECT_DIR}/standalone"
TARBALL=$(npm pack --pack-destination "$TEMP_DIR" 2>/dev/null | tail -1)
echo "Created: $TARBALL"

# 2. Install in temp directory
echo "--- Installing in temp dir ---"
cd "$TEMP_DIR"
npm init -y > /dev/null 2>&1
npm install "${TEMP_DIR}/${TARBALL}" > /dev/null 2>&1
echo "Installed successfully"

# 3. Start the server
echo "--- Starting server (port=${PORT}, pg-port=${PG_PORT}) ---"
npx revisium-standalone --port "$PORT" --pg-port "$PG_PORT" --data "$DATA_DIR" &
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

json_extract() {
  node -p "JSON.parse(require('fs').readFileSync(0,'utf8'))$1" 2>/dev/null
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
}

assert_json() {
  local desc="$1" expr="$2"
  shift 2
  local body
  body=$(curl -sf "$@") || { echo "  FAIL: $desc (curl failed)"; FAIL=$((FAIL + 1)); return; }
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
}

assert_contains() {
  local desc="$1" substring="$2"
  shift 2
  local body
  body=$(curl -sf "$@") || { echo "  FAIL: $desc (curl failed)"; FAIL=$((FAIL + 1)); return; }
  if echo "$body" | grep -q "$substring"; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (response does not contain '$substring')"
    echo "  Response: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
}

echo "--- Running tests ---"

# Swagger docs
assert_status "GET /api returns 200" GET "${BASE_URL}/api" 200

# Create project
PROJECT_RESPONSE=$(curl -sf -X POST "${BASE_URL}/api/organization/${ORG}/projects" \
  -H "Content-Type: application/json" \
  -d '{"projectName":"smoke-test"}')
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
DRAFT_RESPONSE=$(curl -sf "${BASE_URL}/api/organization/${ORG}/projects/smoke-test/branches/master/draft-revision")
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
assert_status "Create table" POST "${BASE_URL}/api/revision/${REVISION_ID}/tables" 200 \
  -H "Content-Type: application/json" \
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
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/articles/create-row" 200 \
  -H "Content-Type: application/json" \
  -d '{
    "rowId": "article-1",
    "data": { "title": "Hello World", "body": "Smoke test content" }
  }'

# Read row and verify data
assert_json "Read row data" \
  "JSON.parse(d).data.title === 'Hello World'" \
  "${BASE_URL}/api/revision/${REVISION_ID}/tables/articles/rows/article-1"

# GraphQL
assert_json "GraphQL responds" \
  "JSON.parse(d).data.__typename === 'Query'" \
  -X POST "${BASE_URL}/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Admin UI
assert_contains "Admin UI serves HTML" "<html" "${BASE_URL}/"

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
