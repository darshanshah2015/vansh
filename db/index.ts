import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { max: 5 });

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === 'development' });
