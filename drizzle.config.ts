import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema',
  out: './db/migrations',
  dialect: 'postgresql',
  strict: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
