# Environment Variables

This document describes all environment variables for **revisium** (self-hosted deployment).

## Quick Start

```bash
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```

---

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

---

## Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |

---

## Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (auto-generated) | JWT signing key |
| `ADMIN_PASSWORD` | `admin` | Default admin user password |
| `ENDPOINT_PASSWORD` | `endpoint` | Default endpoint user password |

---

## OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

---

## File Storage (Optional)

| Variable | Description |
|----------|-------------|
| `FILE_PLUGIN_PUBLIC_ENDPOINT` | Public URL for file access |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_REGION` | S3 region |
| `S3_BUCKET` | S3 bucket name |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |

---

## Email (Optional)

| Variable | Description |
|----------|-------------|
| `EMAIL_TRANSPORT` | SMTP transport string |
| `EMAIL_PUBLIC_URL` | Public URL for email links |
| `EMAIL_FROM` | Sender email address |

---

## Cache (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_ENABLED` | `false` | Enable caching |
| `CACHE_L1_MAX_SIZE` | - | L1 memory cache max size |
| `CACHE_L2_REDIS_URL` | - | Redis URL for L2 cache |
| `CACHE_BUS_HOST` | - | Redis bus host |
| `CACHE_BUS_PORT` | - | Redis bus port |
| `CACHE_DEBUG` | `false` | Enable cache debug logs |

---

## GraphQL Customization (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAPHQL_HIDE_NODE_TYPES` | `false` | Hide node types |
| `GRAPHQL_HIDE_FLAT_TYPES` | `false` | Hide flat types |
| `GRAPHQL_FLAT_POSTFIX` | `Flat` | Flat type postfix |
| `GRAPHQL_NODE_POSTFIX` | `` | Node type postfix |
| `GRAPHQL_PREFIX_FOR_TABLES` | `` | Table prefix |
| `GRAPHQL_PREFIX_FOR_COMMON` | `` | Common prefix |

---

## Metrics (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_ENABLED` | `false` | Enable Prometheus metrics |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | `10000` | Shutdown delay (ms) |

---

## Formula Support (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `FORMULA_ENABLED` | `false` | Enable formula fields (`x-formula` in schema) |

---

## Deprecated Variables

The following variables are deprecated and will be removed in **v3.0.0**:

| Deprecated | Replacement |
|------------|-------------|
| `EXPERIMENTAL_CACHE` | `CACHE_ENABLED` |
| `EXPERIMENTAL_CACHE_L1_MAX_SIZE` | `CACHE_L1_MAX_SIZE` |
| `EXPERIMENTAL_CACHE_L2_REDIS_URL` | `CACHE_L2_REDIS_URL` |
| `EXPERIMENTAL_CACHE_REDIS_BUS_HOST` | `CACHE_BUS_HOST` |
| `EXPERIMENTAL_CACHE_REDIS_BUS_PORT` | `CACHE_BUS_PORT` |
| `EXPERIMENTAL_CACHE_DEBUG` | `CACHE_DEBUG` |
| `OAUTH_GOOGLE_SECRET_ID` | `OAUTH_GOOGLE_CLIENT_SECRET` |
| `OAUTH_GITHUB_SECRET_ID` | `OAUTH_GITHUB_CLIENT_SECRET` |

Using deprecated variables will log a warning but continue to work.

---

## Docker Compose Example

```yaml
services:
  revisium:
    image: revisium/revisium:latest
    ports:
      - 8080:8080
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/revisium
      # Add optional variables as needed
```
