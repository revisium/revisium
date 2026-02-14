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
4. Start the server at http://localhost:9222

Subsequent runs skip initialization and start in ~8 seconds.

## What You Get

- **Admin UI** at http://localhost:9222 — visual interface for managing projects, tables, and data
- **REST API** at http://localhost:9222/api — full CRUD with Swagger docs at http://localhost:9222/api
- **GraphQL API** at http://localhost:9222/graphql — with playground
- **MCP Server** at http://localhost:9222/mcp — for AI agents (Claude Code, Cursor, VS Code)

## CLI Options

```
npx @revisium/standalone@latest [options]

Options:
  --port <number>     Server port (default: 9222)
  --pg-port <number>  PostgreSQL port (default: 5440)
  --data <path>       Data directory (default: ~/.revisium)
  --auth              Enable authentication (default: disabled)
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

## Authentication

By default, authentication is **disabled** — all API endpoints are accessible without login. This is convenient for local development and AI agent integrations.

Use `--auth` to enable authentication:
- Default credentials: `admin` / `admin`
- Login via REST: `POST /api/auth/login` with `{"emailOrUsername": "admin", "password": "admin"}`
- Login via GraphQL: `mutation { login(data: { emailOrUsername: "admin", password: "admin" }) { accessToken } }`

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
└── pgdata/          # PostgreSQL data directory
```

To reset all data, stop the server and delete the data directory:

```bash
rm -rf ~/.revisium
```

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
