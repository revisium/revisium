# Environment Variables

This document lists the environment variables consumed by the Revisium self-hosted app and by `@revisium/standalone`.

## Standalone Defaults

`@revisium/standalone` starts core, endpoint, admin, and embedded PostgreSQL from one command. The standalone launcher starts EmbeddedPostgres separately, ignores `.env` files, and uses the process environment plus CLI options.

| Variable                      | Standalone value                     | Notes                                                                  |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `DATABASE_URL`                | generated                            | Points to embedded PostgreSQL. Any user-provided value is overwritten. |
| `PORT`                        | `--port`, otherwise first free from `9222` | HTTP server port.                                                      |
| `REVISIUM_STANDALONE`         | `1`                                  | Disables `.env` file loading.                                          |
| `REVISIUM_NO_AUTH`            | `true` unless `--auth` is used       | Disables auth for local/agent use.                                     |
| `CACHE_ENABLED`               | `1` unless set                       | Enables in-process cache by default.                                   |
| `JWT_SECRET`                  | `<data>/jwt-secret` unless set       | Generated and persisted automatically for stable tokens/internal keys.  |
| `STORAGE_PROVIDER`            | `local` unless set                   | If all `S3_*` vars are set and provider is unset, defaults to `s3`.    |
| `STORAGE_LOCAL_PATH`          | `<data>/uploads` unless set          | Local file uploads directory.                                          |
| `PUBLIC_URL`                  | `http://localhost:{PORT}`            | Public base URL for OAuth, MCP, and local file URLs.                   |
| `FILE_PLUGIN_PUBLIC_ENDPOINT` | `PUBLIC_URL/files` for local storage | Public file URL prefix for local storage.                              |
| `REVISIUM_CLIENT_DIR`         | package `client/`                    | Admin UI assets.                                                       |
| `REVISIUM_TEMPLATES_DIR`      | package `templates/`                 | Email templates.                                                       |

Standalone CLI options:

| Option               | Default                     | Description                                              |
| -------------------- | --------------------------- | -------------------------------------------------------- |
| `--port <number>`    | first free port from `9222` | Fixed HTTP server port when passed.                       |
| `--pg-port <number>` | first free port from `5440` | Fixed embedded PostgreSQL port when passed.              |
| `--data <path>`      | `~/.revisium`               | Data directory for PostgreSQL and default local uploads. |
| `--auth`             | disabled                    | Enable login and API auth.                               |
| `--help`             | -                           | Print CLI help.                                          |

## Required

| Variable       | Default | Description                                                |
| -------------- | ------- | ---------------------------------------------------------- |
| `DATABASE_URL` | -       | PostgreSQL connection string. Required outside standalone. |

## Server

| Variable      | Default                                                                     | Description                                                                       |
| ------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `PORT`        | `8080` self-hosted, first free from `9222` standalone                       | HTTP server port.                                                                 |
| `BODY_LIMIT`  | `10mb`                                                                      | Maximum JSON request body size.                                                   |
| `PUBLIC_URL`  | self-hosted: `http://localhost:8080`; standalone: `http://localhost:{PORT}` | Public base URL used for OAuth discovery and MCP auth metadata.                   |
| `NODE_ENV`    | -                                                                           | Used for production-sensitive defaults such as cookies and CORS.                  |
| `TRUST_PROXY` | unset                                                                       | Express `trust proxy` value: `true`, `false`, integer hop count, or IP/CIDR list. |
| `CORS_ORIGIN` | dev: reflect request origin; production: same-origin only                   | Comma-separated credentialed CORS allowlist.                                      |

## Authentication

| Variable                      | Default                                                 | Description                                                    |
| ----------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `JWT_SECRET`                  | self-hosted: generated at boot; standalone: persisted in `<data>/jwt-secret` | JWT signing key. Set explicitly for multi-replica deployments or managed secret rotation. |
| `JWT_ACCESS_TOKEN_TTL`        | `30m`                                                   | Access-token lifetime (`ms` duration string).                  |
| `JWT_REFRESH_TOKEN_TTL_DAYS`  | `7`                                                     | Refresh-token lifetime in days.                                |
| `JWT_REFRESH_GRACE_PERIOD_MS` | `30000`                                                 | Refresh-token rotation retry grace period in ms.               |
| `COOKIE_SECURE`               | `NODE_ENV === 'production'`                             | Override cookie `Secure` flag.                                 |
| `COOKIE_SAMESITE`             | `lax`                                                   | Cookie `SameSite`: `lax`, `strict`, or `none`.                 |
| `ADMIN_PASSWORD`              | `admin`                                                 | Initial seeded admin user password. First run only.             |
| `ENDPOINT_PASSWORD`           | `endpoint`                                              | Initial seeded endpoint system-user password. First run only.   |
| `REVISIUM_NO_AUTH`            | `false` self-hosted, `true` standalone without `--auth` | Authorize every request as admin.                              |

## OAuth And MCP

| Variable                       | Default      | Description                                   |
| ------------------------------ | ------------ | --------------------------------------------- |
| `OAUTH_GOOGLE_CLIENT_ID`       | -            | Google OAuth client ID.                       |
| `OAUTH_GOOGLE_CLIENT_SECRET`   | -            | Google OAuth client secret.                   |
| `OAUTH_GITHUB_CLIENT_ID`       | -            | GitHub OAuth client ID.                       |
| `OAUTH_GITHUB_CLIENT_SECRET`   | -            | GitHub OAuth client secret.                   |
| `MCP_ACCESS_TOKEN_EXPIRY_DAYS` | `30`         | Access-token TTL when `scope=mcp` is used.    |
| `ENDPOINT_SERVICE_URL`         | `PUBLIC_URL` | Service URL advertised in MCP OAuth metadata. |

## File Storage

| Variable                      | Default                                                                                                | Description                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `STORAGE_PROVIDER`            | self-hosted: unset; standalone: `local`                                                                | Storage backend: `s3`, `local`, or unset. Self-hosted unset auto-detects S3 from complete `S3_*` config, otherwise disables uploads. |
| `FILE_PLUGIN_PUBLIC_ENDPOINT` | self-hosted local: `http://localhost:{PORT}/files`; standalone local: `PUBLIC_URL/files`; s3: required | Public URL prefix for file access.                                                                                                   |
| `STORAGE_LOCAL_PATH`          | `./uploads` self-hosted, `<data>/uploads` standalone                                                   | Local filesystem upload directory.                                                                                                   |
| `S3_ENDPOINT`                 | -                                                                                                      | S3-compatible endpoint URL.                                                                                                          |
| `S3_REGION`                   | -                                                                                                      | S3 region.                                                                                                                           |
| `S3_BUCKET`                   | -                                                                                                      | S3 bucket name.                                                                                                                      |
| `S3_ACCESS_KEY_ID`            | -                                                                                                      | S3 access key.                                                                                                                       |
| `S3_SECRET_ACCESS_KEY`        | -                                                                                                      | S3 secret key.                                                                                                                       |

## Email

| Variable                 | Default                   | Description                       |
| ------------------------ | ------------------------- | --------------------------------- |
| `EMAIL_TRANSPORT`        | -                         | Nodemailer transport string.      |
| `EMAIL_PUBLIC_URL`       | -                         | Public URL for email links.       |
| `EMAIL_FROM`             | -                         | Sender email address.             |
| `REVISIUM_TEMPLATES_DIR` | bundled/default templates | Override path to email templates. |

## Cache

| Variable             | Default                             | Description                                                |
| -------------------- | ----------------------------------- | ---------------------------------------------------------- |
| `CACHE_ENABLED`      | `false` self-hosted, `1` standalone | Enable BentoCache.                                         |
| `CACHE_L1_MAX_SIZE`  | -                                   | L1 memory cache max size, e.g. `128mb`.                    |
| `CACHE_L2_REDIS_URL` | -                                   | Redis URL for L2 cache.                                    |
| `CACHE_BUS_HOST`     | -                                   | Redis bus host. Required when `CACHE_L2_REDIS_URL` is set. |
| `CACHE_BUS_PORT`     | -                                   | Redis bus port. Required when `CACHE_L2_REDIS_URL` is set. |
| `CACHE_DEBUG`        | `false`                             | Enable cache debug logs.                                   |

## Transactions

| Variable                    | Default | Description                                         |
| --------------------------- | ------- | --------------------------------------------------- |
| `TRANSACTION_MAX_WAIT`      | `10000` | Prisma transaction connection wait time in ms.      |
| `TRANSACTION_TIMEOUT`       | `15000` | Prisma transaction timeout in ms.                   |
| `TRANSACTION_MAX_RETRIES`   | `20`    | Max retries for serializable transaction conflicts. |
| `TRANSACTION_BASE_DELAY_MS` | `30`    | Initial retry delay in ms.                          |
| `TRANSACTION_MAX_DELAY_MS`  | `1500`  | Max retry delay in ms.                              |

## Endpoint API Generation

| Variable                    | Default | Description                                 |
| --------------------------- | ------- | ------------------------------------------- |
| `GRAPHQL_HIDE_NODE_TYPES`   | `false` | Hide generated node types.                  |
| `GRAPHQL_HIDE_FLAT_TYPES`   | `false` | Hide generated flat types.                  |
| `GRAPHQL_HIDE_MUTATIONS`    | `false` | Hide generated mutations.                   |
| `GRAPHQL_FLAT_POSTFIX`      | `Flat`  | Generated flat type postfix.                |
| `GRAPHQL_NODE_POSTFIX`      | empty   | Generated node type postfix.                |
| `GRAPHQL_PREFIX_FOR_TABLES` | empty   | Prefix for generated table types.           |
| `GRAPHQL_PREFIX_FOR_COMMON` | empty   | Prefix for generated common types.          |
| `RESTAPI_PREFIX_FOR_TABLES` | empty   | Prefix for generated REST table DTO names.  |
| `RESTAPI_PREFIX_FOR_COMMON` | empty   | Prefix for generated REST common DTO names. |

## Endpoint Synchronization

| Variable                                | Default | Description                                    |
| --------------------------------------- | ------- | ---------------------------------------------- |
| `SYNC_INITIAL_BATCH_SIZE`               | `100`   | Initial endpoint sync batch size.              |
| `SYNC_PG_NOTIFY_ENABLED`                | `true`  | Enable PostgreSQL LISTEN/NOTIFY endpoint sync. |
| `SYNC_PG_NOTIFY_MAX_RECONNECT_ATTEMPTS` | `5`     | Max reconnect attempts for pg notify sync.     |
| `SYNC_DB_POLLING_ENABLED`               | `true`  | Enable database polling endpoint sync.         |
| `SYNC_DB_POLLING_BATCH_SIZE`            | `50`    | Polling batch size.                            |
| `SYNC_DB_POLLING_INTERVAL_MS`           | `30000` | Polling interval in ms.                        |

## Microservice Mode

| Variable                     | Default                                                      | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `ENDPOINT_HOST`              | `localhost`                                                  | Redis host for endpoint microservice transport.              |
| `ENDPOINT_PORT`              | `6380`                                                       | Redis port for endpoint microservice transport.              |
| `CORE_API_URL`               | `http://0.0.0.0:{PORT}`                                      | Core API base URL used by endpoint.                          |
| `CORE_API_URL_USERNAME`      | -                                                            | Deprecated endpoint-to-core password auth username.          |
| `CORE_API_URL_PASSWORD`      | -                                                            | Deprecated endpoint-to-core password auth password.          |
| `INTERNAL_API_KEY_ENDPOINT`  | derived in monolith; required/preferred in microservice mode | Internal API key for endpoint-to-core auth. In microservice mode, must match the core value and `/^rev_[A-Za-z0-9_-]{22}$/`. |
| `INTERNAL_API_KEY_{SERVICE}` | -                                                            | Internal API key for an additional service. Values must match `/^rev_[A-Za-z0-9_-]{22}$/`. |
| `INTERNAL_MONOLITH_SERVICES` | `endpoint`                                                   | Comma-separated services for derived monolith internal keys. |

## Admin Runtime

| Variable                            | Default   | Description                                                    |
| ----------------------------------- | --------- | -------------------------------------------------------------- |
| `REVISIUM_CLIENT_DIR`               | `client/` | Path to built admin assets. Used by standalone/bundled builds. |
| `REACT_APP_ENDPOINT_HOST`           | -         | Runtime admin endpoint host override emitted by `/env.js`.     |
| `REACT_APP_ENDPOINT_PORT`           | -         | Runtime admin endpoint port override emitted by `/env.js`.     |
| `REACT_APP_ENDPOINT_SERVER_URL`     | -         | Admin build/runtime endpoint server URL override.              |
| `REACT_APP_SWAGGER_SERVER_URL`      | -         | Admin build/runtime Swagger API URL override.                  |
| `REACT_APP_GRAPHQL_SERVER_URL`      | -         | Admin build/runtime GraphQL URL override.                      |
| `REACT_APP_GRAPHQL_SERVER_PROTOCOL` | -         | Admin build/runtime GraphQL protocol override.                 |
| `REACT_APP_GRAPHQL_SERVER_HOST`     | -         | Admin build/runtime GraphQL host override.                     |
| `REACT_APP_GRAPHQL_SERVER_PORT`     | -         | Admin build/runtime GraphQL port override.                     |
| `REACT_APP_CETRIFUGE_PROTOCOL`      | -         | Admin build/runtime Centrifuge protocol override.              |
| `REACT_APP_CETRIFUGE_HOST`          | -         | Admin build/runtime Centrifuge host override.                  |
| `REACT_APP_CETRIFUGE_PORT`          | -         | Admin build/runtime Centrifuge port override.                  |
| `PACKAGE_VERSION`                   | -         | Admin build metadata.                                          |
| `GIT_COMMIT_HASH`                   | -         | Admin build metadata.                                          |
| `GIT_BRANCH_NAME`                   | -         | Admin build metadata.                                          |

## Metrics And Shutdown

| Variable                    | Default | Description                         |
| --------------------------- | ------- | ----------------------------------- |
| `METRICS_ENABLED`           | `false` | Enable Prometheus metrics endpoint. |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | `10000` | Shutdown delay in ms.               |

## Enterprise And Billing

| Variable                   | Default | Description                                                                          |
| -------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `REVISIUM_LICENSE_KEY`     | -       | License key for enterprise features.                                                 |
| `REVISIUM_BILLING_ENABLED` | `false` | Feature flag retained for deployments. Billing also requires payment service config. |
| `REVISIUM_SSO_ENABLED`     | `false` | Enable SSO module when available.                                                    |
| `REVISIUM_AUDIT_ENABLED`   | `false` | Enable audit module when available.                                                  |
| `PAYMENT_SERVICE_URL`      | -       | Payment service base URL. Billing is enabled when this is set.                       |
| `PAYMENT_SERVICE_SECRET`   | -       | Shared HMAC secret for core/payment callbacks.                                       |

## API Key Limits

| Variable                      | Default | Description                                |
| ----------------------------- | ------- | ------------------------------------------ |
| `API_KEY_MAX_PER_USER`        | `10`    | Maximum personal API keys per user.        |
| `API_KEY_MAX_SERVICE_PER_ORG` | `100`   | Maximum service API keys per organization. |

## Seed Tooling

| Variable           | Default | Description                                  |
| ------------------ | ------- | -------------------------------------------- |
| `SEED_OPENAPI_URL` | -       | OpenAPI URL used by seed generation tooling. |
| `SEED_URL`         | -       | Base URL used by seed loading tooling.       |

## Deprecated Variables

| Deprecated                          | Replacement                  |
| ----------------------------------- | ---------------------------- |
| `EXPERIMENTAL_CACHE`                | `CACHE_ENABLED`              |
| `EXPERIMENTAL_CACHE_L1_MAX_SIZE`    | `CACHE_L1_MAX_SIZE`          |
| `EXPERIMENTAL_CACHE_L2_REDIS_URL`   | `CACHE_L2_REDIS_URL`         |
| `EXPERIMENTAL_CACHE_REDIS_BUS_HOST` | `CACHE_BUS_HOST`             |
| `EXPERIMENTAL_CACHE_REDIS_BUS_PORT` | `CACHE_BUS_PORT`             |
| `EXPERIMENTAL_CACHE_DEBUG`          | `CACHE_DEBUG`                |
| `OAUTH_GOOGLE_SECRET_ID`            | `OAUTH_GOOGLE_CLIENT_SECRET` |
| `OAUTH_GITHUB_SECRET_ID`            | `OAUTH_GITHUB_CLIENT_SECRET` |
