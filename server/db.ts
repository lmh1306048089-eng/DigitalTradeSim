import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// Use PostgreSQL connection from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const connection = neon(DATABASE_URL);
export const db = drizzle(connection, { schema });