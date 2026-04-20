import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { logger } from './logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveMigrationsFolder(): string | null {
  const candidates = [
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '../db/migrations'),
    path.resolve(__dirname, '../../db/migrations'),
    path.resolve(__dirname, '../../../db/migrations'),
    path.resolve(process.cwd(), 'db/migrations'),
    path.resolve(process.cwd(), 'dist/migrations'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function runMigrations(): Promise<void> {
  const folder = resolveMigrationsFolder();
  if (!folder) {
    logger.warn('Migrations folder not found — skipping');
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.warn('DATABASE_URL not set — skipping migrations');
    return;
  }

  const client = postgres(connectionString, { max: 1 });
  try {
    const db = drizzle(client);
    logger.info({ folder }, 'Running database migrations');
    await migrate(db, { migrationsFolder: folder });
    logger.info('Migrations applied');
  } finally {
    await client.end({ timeout: 5 });
  }
}
