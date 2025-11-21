import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'node_modules/@revisium/core/dist/prisma/schema.prisma',
  migrations: {
    path: 'node_modules/@revisium/core/dist/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
