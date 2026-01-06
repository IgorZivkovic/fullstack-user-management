import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ?? './user_management.db';

export default defineConfig({
  schema: './api/src/db/schema.ts',
  out: './api/src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: databaseUrl,
  },
});
