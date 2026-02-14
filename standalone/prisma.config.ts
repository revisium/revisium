import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, env } from 'prisma/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: resolve(__dirname, 'prisma/schema.prisma'),
  migrations: {
    path: resolve(__dirname, 'prisma/migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
