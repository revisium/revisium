#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_PKG="$ROOT_DIR/package.json"
TEMPLATE="$SCRIPT_DIR/package.json.template"
STANDALONE_PKG="$SCRIPT_DIR/package.json"

CORE_DIR="$(node -e "console.log(require.resolve('@revisium/core/package.json').replace('/package.json',''))")"

echo "Building standalone package..."

# 1. Clean
rm -rf "$SCRIPT_DIR/dist" "$SCRIPT_DIR/client" "$SCRIPT_DIR/prisma" "$SCRIPT_DIR/templates"

# 2. Copy client/ (admin UI static files)
cp -R "$ROOT_DIR/client" "$SCRIPT_DIR/client"
rm -rf "$SCRIPT_DIR/client/dist"

# 4. Copy runtime assets from @revisium/core
mkdir -p "$SCRIPT_DIR/prisma"
cp -R "$CORE_DIR/dist/prisma/migrations" "$SCRIPT_DIR/prisma/migrations"
cp "$CORE_DIR/dist/prisma/schema.prisma" "$SCRIPT_DIR/prisma/schema.prisma"
cp -R "$CORE_DIR/dist/prisma/seed" "$SCRIPT_DIR/prisma/seed"

mkdir -p "$SCRIPT_DIR/templates"
cp -R "$CORE_DIR/dist/src/infrastructure/email/templates/"* "$SCRIPT_DIR/templates/"

# 5. esbuild main bundle
echo "Bundling standalone.js..."
npx esbuild "$ROOT_DIR/dist/src/standalone.js" \
  --bundle \
  --platform=node \
  --target=node20 \
  --minify \
  --keep-names \
  --outfile="$SCRIPT_DIR/dist/standalone.js" \
  --external:embedded-postgres \
  --external:sharp \
  --external:bcrypt \
  --external:pg-native \
  --external:@nestjs/websockets \
  --external:@nestjs/microservices \
  --external:@fastify/static \
  --external:class-transformer/storage \
  --external:nats \
  --external:mqtt \
  --external:kafkajs \
  --external:amqplib \
  --external:amqp-connection-manager \
  --external:@grpc/grpc-js \
  --external:@grpc/proto-loader \
  --external:@mikro-orm/core \
  --external:@nestjs/sequelize \
  --external:@nestjs/typeorm \
  --external:@nestjs/mongoose \
  --external:ts-morph

# 6. esbuild seed bundle
echo "Bundling seed.js..."
npx esbuild "$CORE_DIR/dist/prisma/seed.js" \
  --bundle \
  --platform=node \
  --target=node20 \
  --minify \
  --outfile="$SCRIPT_DIR/prisma/seed.js" \
  --external:bcrypt \
  --external:pg-native

# 7. Generate package.json from template + root/core package.json versions
echo "Generating package.json..."
node -e "
const root = require('$ROOT_PKG');
const corePkg = require('$CORE_DIR/package.json');
const template = JSON.parse(require('fs').readFileSync('$TEMPLATE', 'utf-8'));
const deps = { ...root.dependencies, ...root.devDependencies };
const coreDeps = { ...corePkg.dependencies, ...corePkg.devDependencies };

template.version = root.version;
template.dependencies = {
  '@nestjs/microservices': coreDeps['@nestjs/microservices'],
  'embedded-postgres': deps['embedded-postgres'],
  'prisma': deps['prisma'],
  'sharp': coreDeps['sharp'],
  'bcrypt': coreDeps['bcrypt'],
};
template.revisiumCore = deps['@revisium/core'] || '?';
template.revisiumEndpoint = deps['@revisium/endpoint'] || '?';
template.revisiumAdmin = deps['@revisium/admin'] || '?';

require('fs').writeFileSync('$STANDALONE_PKG', JSON.stringify(template, null, 2) + '\n');
console.log('  version: ' + template.version);
Object.entries(template.dependencies).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
console.log('  core (bundled): ' + template.revisiumCore);
console.log('  endpoint (bundled): ' + template.revisiumEndpoint);
console.log('  admin (bundled): ' + template.revisiumAdmin);
"

echo ""
echo "Standalone package ready at $SCRIPT_DIR"
echo ""
echo "To publish:  cd standalone && npm publish --access public --tag alpha"
echo "To inspect:  cd standalone && npm pack"
