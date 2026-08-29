import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  schema: './backend/prisma/schema.prisma',
  migrations: {
    path: './backend/prisma/migrations',
  },
});
