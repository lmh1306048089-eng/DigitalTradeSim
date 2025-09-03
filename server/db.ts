import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use environment variable for consistency with drizzle.config.ts
// Fallback to the specific connection string if env var not set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://user_replit_pos_fb6d057f:6f874b51b8bd77e859cac4c340a937d5@69.5.18.225:51821/replit_postgresql_1756917217105_7b26ed19";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const connection = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

export const db = drizzle(connection, { schema });