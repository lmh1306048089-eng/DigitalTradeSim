import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use environment variable for PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

let connectionConfig: any = {
  connectionString: DATABASE_URL,
  max: 10,
};

// Configure SSL based on environment
if (DATABASE_URL?.includes('ssl=true') || process.env.NODE_ENV === 'production') {
  connectionConfig.ssl = { rejectUnauthorized: false };
} else if (process.env.NODE_ENV === 'development') {
  connectionConfig.ssl = false;
}

export const connection = new Pool(connectionConfig);

export const db = drizzle(connection, { schema });