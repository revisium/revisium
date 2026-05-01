# Standalone Build System

This package is built from the [revisium](https://github.com/revisium/revisium) monorepo.

## How the Bundle Works

`build.sh` uses esbuild to bundle all pure JS dependencies (NestJS, Prisma client+WASM, pg driver, ioredis, etc.) into a single file. Native modules that require platform-specific binaries stay as npm dependencies and are installed normally by npm.

## Build Prerequisites

1. Run `npm run build` (tsc) in the root revisium directory first
2. `@revisium/core`, `@revisium/endpoint`, and `@revisium/admin` must be installed in `node_modules/`
3. Admin client must be copied: `npm run copy:admin`

## Build Command

```bash
npm run standalone:build   # runs tsc + build.sh
# or
npm run build && bash standalone/build.sh
```

## What build.sh Does

1. **Clean** — removes `bin/`, `dist/`, `client/`, `prisma/`, `templates/` from `standalone/`
2. **Copy bin/** — entry point script that spawns node with `--experimental-require-module`
3. **Copy client/** — admin UI static files from `@revisium/admin`
4. **Copy runtime assets** from `@revisium/core`:
   - `prisma/migrations/` — SQL migration files (read by Prisma CLI at runtime)
   - `prisma/schema.prisma` — Prisma schema (read by Prisma CLI at runtime)
   - `prisma/seed/` — JSON data for permissions and roles (read by seed script via `__dirname`)
   - `templates/` — Handlebars email templates (read by TemplateService at runtime)
5. **esbuild main bundle** — `dist/src/standalone.js` -> `standalone/dist/standalone.js` (~14MB minified)
6. **esbuild seed bundle** — `@revisium/core/dist/prisma/seed.js` -> `standalone/prisma/seed.js` (~5MB minified)
7. **Generate package.json** — from template with versions from root and core package.json

## esbuild Externals

Modules marked `--external` are NOT bundled:

**Native modules (npm dependencies):**

- `embedded-postgres` — downloads platform-specific PostgreSQL binary
- `sharp` — native image processing (libvips)
- `bcrypt` — native password hashing
- `pg-native` — optional native PostgreSQL driver (conditionally imported)

**NestJS modules loaded via dynamic require** (npm dependencies):

- `@nestjs/microservices` — used by core's notification module (Redis transport)

**NestJS optional/lazy imports** (require'd inside try/catch, never actually used):

- `@nestjs/websockets`, `@fastify/static`, `class-transformer/storage`
- `nats`, `mqtt`, `kafkajs`, `amqplib`, `amqp-connection-manager` — microservice transports
- `@grpc/grpc-js`, `@grpc/proto-loader` — gRPC transport
- `@mikro-orm/core`, `@nestjs/sequelize`, `@nestjs/typeorm`, `@nestjs/mongoose` — optional ORMs
- `ts-morph` — Swagger plugin (dev-only)

When a new optional dependency causes esbuild to fail or crashes at runtime, add it to the `--external` list in `build.sh`.

## Path Resolution

In the bundled output, `__dirname` = `<package>/dist/`. The entry point `bin/revisium-standalone.js` sets package path env vars before spawning the bundle. `src/standalone.ts` sets runtime defaults before dynamically importing `AppModule`, so modules that choose providers at import/decorator time see the standalone defaults.

| Env Var                       | Value                                                          | Used By                                     |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| `REVISIUM_STANDALONE`         | `1`                                                            | `ConfigModule` ignores `.env` files         |
| `REVISIUM_CLIENT_DIR`         | `<package>/client`                                             | `AdminModule.forRoot()` in `app.module.ts`  |
| `REVISIUM_TEMPLATES_DIR`      | `<package>/templates`                                          | `TemplateService` in `@revisium/core`       |
| `JWT_SECRET`                  | `<data>/jwt-secret` unless overridden                          | Auth tokens and internal API keys           |
| `STORAGE_PROVIDER`            | `local` unless overridden, or `s3` when complete S3 env exists | `@revisium/core` storage provider selection |
| `STORAGE_LOCAL_PATH`          | `<data>/uploads` unless overridden                             | `LocalStorageService`                       |
| `PUBLIC_URL`                  | `http://localhost:<port>` unless overridden                    | OAuth/MCP metadata and local file URL base  |
| `FILE_PLUGIN_PUBLIC_ENDPOINT` | `PUBLIC_URL/files` for local storage unless overridden         | file URL generation                         |

These env vars have no effect on Docker builds — the code falls back to `__dirname`-based paths when unset.

## Publish

The `@revisium/standalone` package is published by the `Publish Standalone Package to npmjs`
workflow when a release tag is pushed:

- `vX.Y.Z-alpha.N` publishes with npm tag `alpha`
- `vX.Y.Z-rc.N` publishes with npm tag `rc`
- `vX.Y.Z` publishes with npm tag `latest` only when it is the highest stable tag
- older stable maintenance releases publish with npm tag `release-X-Y`

Build locally with `npm run standalone:build` and inspect with `cd standalone && npm pack`.

## Testing Locally

Preferred full smoke test from the repository root:

```bash
bash scripts/standalone-smoke-test.sh
```

That command builds a real package tarball, installs it in a temp project, and runs through the packaged `npx revisium-standalone` path.

For a manual package install:

```bash
cd standalone && npm pack
mkdir /tmp/standalone-test && cd /tmp/standalone-test
npm init -y
npm install /path/to/revisium-standalone-*.tgz
npx revisium-standalone
```

For a direct entrypoint run from the repository root, install the generated package runtime dependencies first:

```bash
npm run standalone:build
npm --prefix standalone install --no-package-lock
node standalone/bin/revisium-standalone.js
```

Direct entrypoint runs need `standalone/node_modules` because native/runtime externals such as `embedded-postgres`, `sharp`, and `bcrypt` are intentionally not bundled.

## Size Budget

| Component               | Size     |
| ----------------------- | -------- |
| Main bundle (minified)  | ~14MB    |
| Seed bundle (minified)  | ~5MB     |
| Admin client            | ~3.5MB   |
| Prisma assets           | ~0.3MB   |
| **tgz (compressed)**    | **~7MB** |
| Native deps (installed) | ~200MB   |

## Package Structure

```
standalone/
├── bin/revisium-standalone.js      # Entry point
├── dist/standalone.js              # esbuild bundle (~14MB)
├── client/                         # Admin UI (~3.5MB)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.js                     # Bundled seed (~5MB)
│   └── seed/                       # JSON data for seed
├── templates/                      # Email templates (.hbs)
├── prisma.config.ts                # Prisma config
├── package.json.template           # Template (versioned in git)
├── package.json                    # Generated by build.sh (in .gitignore)
└── build.sh                        # Build script
```
