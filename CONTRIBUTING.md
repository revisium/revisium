# Contributing

Welcome, and thanks for your interest in contributing to Revisium! This document explains how to run the full stack locally for development and testing.

## Local Development

Follow these steps to run the entire Revisium stack on your machine.

### 1. Prerequisites

- **Node.js**: install the latest LTS. We recommend using [nvm][nvm] with an `.nvmrc` in each repo.
- **Docker & Docker Compose**: ensure both are installed and running.

### 2. revisium-core

1. Clone the [repo](https://github.com/revisium/revisium-core) and switch to its directory:
   ```bash
   git clone https://github.com/revisium/revisium-core.git
   cd revisium-core
   ```
2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # → edit `.env` (e.g. DATABASE_URL, REDIS_URL) as needed
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start PostgreSQL and Redis:
   ```bash
   docker-compose up -d
   ```
5. Apply database migrations and seed initial data:
   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:generate
   npm run seed
   ```
6. Launch the core service in debug mode:
   ```bash
   npm run start:debug
   ```

### 3. revisium-endpoint

1. In a new terminal, clone and enter the endpoint [repo](https://github.com/revisium/revisium-endpoint):
   ```bash
   git clone https://github.com/revisium/revisium-endpoint.git
   cd revisium-endpoint
   ```
2. Copy `.env` and install:
   ```bash
   cp .env.example .env
   npm install
   ```

3. Generate prisma client:
   ```bash
   npm run prisma:generate
   ```

4. Start the endpoint service in debug mode:
   ```bash
   npm run start:debug
   ```

### 4. revisium-admin

1. In another terminal, clone and enter the admin [repo](https://github.com/revisium/revisium-admin):
   ```bash
   git clone https://github.com/revisium/revisium-admin.git
   cd revisium-admin
   ```
2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

### 5. Open the Admin UI

- Navigate to [http://localhost:5173/](http://localhost:5173/)
- **Username:** `admin`
- **Password:** `admin`

---

If you encounter any issues or have questions, please open an issue in the corresponding repo. We appreciate your contributions!

[nvm]: https://github.com/nvm-sh/nvm?tab=readme-ov-file#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file
