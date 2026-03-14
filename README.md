<div align="center">

# Revisium

Unopinionated data platform with referential integrity.

**Your schema. Your data. Full control.**

[![License](https://img.shields.io/github/license/revisium/revisium?color=blue)](LICENSE)
[![Docker](https://img.shields.io/docker/v/revisium/revisium?label=docker&sort=semver)](https://hub.docker.com/r/revisium/revisium)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium)

> JSON Schema flexibility + Foreign Keys reliability.
> Git-like versioning: branches, revisions, drafts.
> Schema evolution with data migrations.
> Auto-generated GraphQL + REST APIs.

[Website](https://revisium.io) · [Cloud](https://cloud.revisium.io) · [Docker Hub](https://hub.docker.com/r/revisium/revisium)

</div>

## What is Revisium

Revisium is an unopinionated microservice for structured JSON data with relational integrity, schema enforcement, auto-generated APIs, Git-like versioning, and a built-in Admin UI — from schema design to change review. The platform does not impose a fixed data model — schema is designed to fit the project's needs, from flat key-value to deeply nested hierarchies.

Managed through Admin UI, GraphQL API, REST API, MCP Protocol, or any combination.

<img width="1216" height="764" alt="rev" src="https://github.com/user-attachments/assets/536b9c1b-bab8-40c4-a0ba-3620601e105b" />

## Key Features

| # | Feature | Why it matters |
|---|---------|----------------|
| 1 | **JSON Schema** | Any structure — primitives, objects, arrays, any nesting depth |
| 2 | **Foreign Keys** | Referential integrity — validation on write, cascade rename, can't delete if referenced |
| 3 | **Computed Fields** | `x-formula` expressions — 40+ functions, aggregations over arrays |
| 4 | **Files** | S3 file attachments at any schema level — images, documents, galleries |
| 5 | **Versioning** | Branches, revisions, drafts — full history, diff, rollback |
| 6 | **Schema Evolution** | Change types, add/remove fields — existing data transforms automatically |
| 7 | **Migrations CLI** | Auto-generated migrations, portable across branches and instances via [revisium-cli](https://github.com/revisium/revisium-cli) |
| 8 | **APIs** | System API (GraphQL, REST, MCP) + auto-generated typed APIs from your schema |
| 9 | **Admin UI** | Visual schema editor, table views with filters/sorts, diff viewer, change review |
| 10 | **Self-Hosted** | Apache 2.0, your infrastructure, no vendor lock-in |

## Quick Start

### Cloud

Try without installing — [cloud.revisium.io](https://cloud.revisium.io)

### Standalone (no dependencies)

```bash
npx @revisium/standalone@latest
```

Open [http://localhost:9222](http://localhost:9222) — no auth by default, `--auth` to enable (login: `admin` / `admin`).

Embedded PostgreSQL, zero configuration. Perfect for local development and AI agent integrations.

See [@revisium/standalone README](./standalone/README.md) for all CLI options, MCP setup, and authentication details.

> For production deployment (Docker Compose, Kubernetes), see [Deployment Options](#deployment-options).

## Use Cases

### Headless CMS
Content managed in Revisium (Admin UI or API), consumed by frontends via auto-generated REST/GraphQL. Branches for staging/production, drafts for editorial workflow.

### Dictionary / Master Data
Single source of truth for reference data (currencies, categories, product specs) shared across microservices. Foreign keys guarantee consistency.

### Configuration Store
Application settings, feature flags, pricing rules as versioned JSON. Draft → review → commit workflow. Branches for dev/staging/prod environments.

### AI Agent Memory
Structured memory for AI agents (Claude Code, Cursor, custom). Typed schemas, version control, rollback on corruption. Human review of agent-written data via Admin UI. [MCP Protocol](https://modelcontextprotocol.io) support built-in.

### Game Data & Complex Domains
Items, characters, quests with rich relationships. Schema validation, computed fields (40+ formula functions), file attachments via S3.

## Data Model

```
Organization
  └── Project
        └── Branch (master, staging, dev)
              └── Revision (immutable snapshot) / Draft (WIP)
                    └── Table (JSON Schema)
                          └── Row (id + data)
```

### Example: e-commerce with foreign keys and computed fields

**Table `categories`** — row id: `"electronics"`
```json
{
  "name": "Electronics",
  "description": "Smartphones, laptops, accessories"
}
```

**Table `products`** — row id: `"iphone-16"`
```jsonc
{
  "title": "iPhone 16 Pro",
  "category": "electronics",         // ← FK → categories
  "price": 999,
  "quantity": 50,
  "total": 49950,                    // ← computed: price * quantity
  "inStock": true,                   // ← computed: quantity > 0
  "specs": {
    "weight": 199,
    "tags": ["5G", "USB-C"]
  },
  "relatedProducts": ["macbook-m4"]  // ← array of FK → products
}
```

### Example: GraphQL query on auto-generated API

```graphql
query {
  products(
    where: { category: { eq: "electronics" } }
    orderBy: { price: DESC }
    first: 10
  ) {
    edges {
      node {
        id
        title
        price
        category {
          name  # Auto-resolved via foreignKey
        }
      }
    }
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   revisium (this repo)                  │
│              All-in-one self-hosted package             │
├─────────────────┬─────────────────┬─────────────────────┤
│  @revisium/core │ @revisium/admin │ @revisium/endpoint  │
│  Backend API    │  Web UI         │  API generator      │
├─────────────────┴─────────────────┴─────────────────────┤
│                     API Layer                           │
├───────────┬───────────┬───────────┬─────────────────────┤
│  GraphQL  │  REST API │    MCP    │   Generated APIs    │
│           │           │           │  (GraphQL + REST)   │
├───────────┴───────────┴───────────┴─────────────────────┤
│                  Infrastructure                         │
├───────────┬───────────┬───────────┬─────────────────────┤
│ PostgreSQL│   Redis   │    S3     │       SMTP          │
│ (required)│ (optional)│ (optional)│     (optional)      │
└───────────┴───────────┴───────────┴─────────────────────┘
```

## Ecosystem

### Platform

| Package | Description | Quality |
|---------|-------------|---------|
| **[revisium](https://github.com/revisium/revisium)** | All-in-one self-hosted deployment | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium) |
| [@revisium/core](https://github.com/revisium/revisium-core) | Backend API — GraphQL, REST, MCP | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium-core&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium-core) |
| [@revisium/admin](https://github.com/revisium/revisium-admin) | Web UI — schema editor, data management, diff viewer | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium-admin&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium-admin) |
| [@revisium/endpoint](https://github.com/revisium/revisium-endpoint) | Auto-generated GraphQL + REST APIs | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium-endpoint&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium-endpoint) |

### Libraries

| Package | Description | Quality |
|---------|-------------|---------|
| [@revisium/schema-toolkit](https://github.com/revisium/schema-toolkit) | JSON Schema engine — validation, diff, patch, migrations | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_schema-toolkit&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_schema-toolkit) |
| [@revisium/schema-toolkit-ui](https://github.com/revisium/schema-toolkit-ui) | Schema / Row / Table editors for React | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_schema-toolkit-ui&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_schema-toolkit-ui) |
| [@revisium/formula](https://github.com/revisium/formula) | Formula expression engine — 40+ built-in functions | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_formula&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_formula) |
| [@revisium/prisma-pg-json](https://github.com/revisium/prisma-pg-json) | PostgreSQL JSON query builder for Prisma | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_prisma-pg-json&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_prisma-pg-json) |
| [@revisium/client](https://github.com/revisium/revisium-client) | TypeScript API client | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium-client&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium-client) |

### Tools & Integrations

| Package | Description | Quality |
|---------|-------------|---------|
| [@revisium/mcp-memory](https://github.com/revisium/mcp-memory) | MCP server for AI agent memory ![alpha](https://img.shields.io/badge/status-alpha-orange) | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_mcp-memory&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_mcp-memory) |
| [revisium-cli](https://github.com/revisium/revisium-cli) | Schema migration CLI — save & apply across environments | [![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=revisium_revisium-cli&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_revisium-cli) |

### Dependency Graph

```
revisium (self-hosted)
├── @revisium/core
│   ├── @revisium/schema-toolkit
│   │   └── @revisium/formula
│   └── @revisium/prisma-pg-json
├── @revisium/admin
│   ├── @revisium/schema-toolkit-ui
│   │   ├── @revisium/schema-toolkit
│   │   └── @revisium/formula
│   └── @revisium/formula
└── @revisium/endpoint
    └── @revisium/schema-toolkit

@revisium/mcp-memory ──► @revisium/client
revisium-cli ──► @revisium/client + @revisium/schema-toolkit
```

## Configuration

See [ENV.md](./ENV.md) for all environment variables.

## Deployment Options

| Option | Description |
|--------|-------------|
| **Docker Compose** | Full stack with PostgreSQL — recommended for quick start |
| **Docker** | Single container, bring your own PostgreSQL |
| **Kubernetes** | Helm chart, horizontal scaling |
| **Cloud** | Managed SaaS — [cloud.revisium.io](https://cloud.revisium.io) |

### Requirements

- PostgreSQL 14+
- Node.js 20+ (for standalone and CLI only)
- S3-compatible storage (optional, for file uploads)
- Redis (optional, for caching and multi-pod sync)

## License

Apache 2.0 — see [LICENSE](./LICENSE).
