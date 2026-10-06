import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local'), override: false });
config({ path: resolve(__dirname, '.env'), override: false });

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: './prisma/migrations',
  },
});