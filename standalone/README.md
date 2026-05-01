# @revisium/standalone

[Revisium](https://github.com/revisium/revisium) with embedded PostgreSQL — zero-dependency headless CMS with Git-like version control.

No Docker, no external database, no configuration required. One command to start.

## Quick Start

```bash
npx @revisium/standalone@latest
```

On first run, Revisium will:

1. Initialize an embedded PostgreSQL database in `~/.revisium/pgdata`
2. Run database migrations
3. Seed the default admin user
4. Start the server on the first free HTTP port from http://localhost:9222

Subsequent runs skip initialization and start in ~8 seconds.

## What You Get

- **Admin UI** at http://localhost:9222 — visual interface for managing projects, tables, and data
- **REST API** at http://localhost:9222/api — full CRUD with Swagger docs at http://localhost:9222/api
- **GraphQL API** at http://localhost:9222/graphql — with playground
- **MCP Server** at http://localhost:9222/mcp — for AI agents (Claude Code, Cursor, VS Code)

If port 9222 is busy and `--port` is not passed, standalone prints the next selected port and uses that port for all URLs.

## CLI Options

```text
npx @revisium/standalone@latest [options]

Options:
  --port <number>     Fixed HTTP server port (default: first free port from 9222)
  --pg-port <number>  Fixed PostgreSQL port (default: first free port from 5440)
  --data <path>       Data directory (default: ~/.revisium)
  --auth              Enable authentication (default: disabled)
  -h, --help          Show help
```

### Examples

```bash
# Custom ports
npx @revisium/standalone@latest --port 3000 --pg-port 5555

# Enable authentication (login required, default credentials: admin/admin)
npx @revisium/standalone@latest --auth

# Custom data directory
npx @revisium/standalone@latest --data ./my-data
```

## Testing Local Changes

From the repository root, build the standalone package assets first:

```bash
npm run standalone:build
```

Recommended: test the same packaged path users get from npm:

```bash
bash scripts/standalone-smoke-test.sh
```

The smoke test packs `standalone/`, installs the tarball in a temp project, starts the server on a free HTTP port with automatic PostgreSQL port selection, then verifies Swagger, project/table/row CRUD, local file upload and serving, GraphQL, and the Admin UI. To force ports:

```bash
PORT=9222 PG_PORT=5440 bash scripts/standalone-smoke-test.sh
```

For quick manual testing, install the standalone package runtime dependencies once:

```bash
npm --prefix standalone install --no-package-lock
```

Then run the built standalone entrypoint directly:

```bash
node standalone/bin/revisium-standalone.js \
  --port 9222 \
  --data ./.revisium-standalone-test
```

Open:

- Admin UI: http://localhost:9222
- REST/Swagger: http://localhost:9222/api
- GraphQL: http://localhost:9222/graphql
- MCP: http://localhost:9222/mcp

The direct entrypoint uses the generated package layout. Native/runtime dependencies like `embedded-postgres`, `sharp`, and `bcrypt` are intentionally not bundled, so direct local runs need `standalone/node_modules`. Published `npx @revisium/standalone@latest` installs these dependencies automatically.

For a quick CLI help check:

```bash
node standalone/bin/revisium-standalone.js --help
```

## Authentication

By default, authentication is **disabled** — all API endpoints are accessible without login. This is convenient for local development and AI agent integrations.

Use `--auth` to enable authentication:

- Default credentials: `admin` / `admin`
- Login via REST: `POST /api/auth/login` with `{"emailOrUsername": "admin", "password": "admin"}`
- Login via GraphQL: `mutation { login(data: { emailOrUsername: "admin", password: "admin" }) { accessToken } }`

Set `ADMIN_PASSWORD` before the first run to change the seeded admin password. Existing data directories keep the password already stored in the database.

## MCP Integration

Connect AI agents to Revisium as a memory/data layer.

### Claude Code

Add to your MCP config:

```json
{
  "mcpServers": {
    "revisium": {
      "url": "http://localhost:9222/mcp"
    }
  }
}
```

When auth is disabled, no login is required — all MCP tools are available immediately.

## Data Persistence

All data is stored in `~/.revisium/` (or the path specified with `--data`):

```
~/.revisium/
├── pgdata/          # PostgreSQL data directory
├── jwt-secret       # generated JWT/internal API secret
└── uploads/         # local file uploads
```

To reset all data, stop the server and delete the data directory:

```bash
rm -rf ~/.revisium
```

Multiple standalone processes can share the same data directory. The first process starts PostgreSQL; later processes reuse the running PostgreSQL port from `pgdata/postmaster.pid` and only start their own HTTP server. Keep the first process running while other shared-data instances are active, or run independent instances with different `--data` paths.

## Environment Variables

Standalone is zero-config by default. It sets the required runtime envs itself after parsing CLI options and before loading the app module.

| Variable                      | Default in standalone          | Description                                                                                    |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `PORT`                        | `--port`, otherwise first free from `9222` | HTTP server port.                                                                              |
| `DATABASE_URL`                | generated                      | Embedded PostgreSQL connection string. User-provided values are overwritten.                   |
| `REVISIUM_STANDALONE`         | `1`                            | Disables `.env` loading.                                                                       |
| `REVISIUM_NO_AUTH`            | `true` unless `--auth` is used | Disables auth for local/agent use.                                                             |
| `CACHE_ENABLED`               | `1` unless set                 | Enables in-process cache by default.                                                           |
| `STORAGE_PROVIDER`            | `local` unless set             | Use `local` or `s3`. If all `S3_*` vars are set and this is unset, standalone uses `s3`.       |
| `STORAGE_LOCAL_PATH`          | `<data>/uploads`               | Local upload directory.                                                                        |
| `PUBLIC_URL`                  | `http://localhost:{PORT}`      | Public base URL for OAuth/MCP metadata and local file URLs.                                    |
| `FILE_PLUGIN_PUBLIC_ENDPOINT` | `PUBLIC_URL/files` for local   | Public file URL prefix. Required for S3 public URLs.                                           |
| `S3_ENDPOINT`                 | -                              | S3-compatible endpoint URL.                                                                    |
| `S3_REGION`                   | -                              | S3 region.                                                                                     |
| `S3_BUCKET`                   | -                              | S3 bucket name.                                                                                |
| `S3_ACCESS_KEY_ID`            | -                              | S3 access key.                                                                                 |
| `S3_SECRET_ACCESS_KEY`        | -                              | S3 secret key.                                                                                 |
| `JWT_SECRET`                  | `<data>/jwt-secret` unless set | Generated and persisted automatically. Usually leave unset.                                     |
| `ADMIN_PASSWORD`              | `admin`                        | Initial seeded admin password when `--auth` is used. First run only.                           |
| `ENDPOINT_PASSWORD`           | `endpoint`                     | Advanced seeded endpoint system-user password. Usually leave unset.                            |
| `BODY_LIMIT`                  | `10mb`                         | JSON request body limit.                                                                       |

See [`../ENV.md`](../ENV.md) for the full self-hosted and standalone env reference.

## How It Works

The standalone package bundles Revisium into a single npm package:

- **@revisium/core** — backend API, business logic, database schema
- **@revisium/endpoint** — dynamic REST/GraphQL API generation
- **@revisium/admin** — frontend administration UI
- **embedded-postgres** — PostgreSQL binary, no system installation needed

All pure JS dependencies are bundled with esbuild into a single file. Only native modules (embedded-postgres, sharp, bcrypt) are installed as npm dependencies.

## Requirements

- **Node.js >= 20**
- ~200 MB disk space (PostgreSQL binary + native deps)
- macOS (arm64, x64) or Linux (x64)

## Graceful Shutdown

Press `Ctrl+C` to stop. The server will:

1. Close all HTTP connections
2. Shut down NestJS services
3. Checkpoint and stop PostgreSQL cleanly

Data is always safe — PostgreSQL ensures durability.

## License

Apache-2.0
