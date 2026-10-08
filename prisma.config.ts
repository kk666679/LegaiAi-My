import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load env files if present. dotenv does not throw if a file is missing.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

// Keep Prisma CLI pointed at the same database as backend/src/db/index.ts.
// `prisma generate` must work without a configured database, so the last
// fallback is intentionally fake and is never dialed by generation.
const DATABASE_URL =
  process.env.ORM_DATABASE_URL ??
  process.env.ORM_PRISMA_DATABASE_URL ??
  process.env.ORM_POSTGRES_URL ??
  process.env.DATABASE_URL ??
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: 'backend/prisma/schema.prisma',
  migrations: {
    path: 'backend/prisma/migrations',
  },
  datasource: {
    url: DATABASE_URL,
  },
});
