import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load env files if present. dotenv does not throw if a file is missing.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

// DATABASE_URL is only required for commands that touch the database
// (migrate, db push, db pull, studio). `prisma generate` must work without it,
// so we fall back to a clearly-fake connection string that is never dialed.
const DATABASE_URL =
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
