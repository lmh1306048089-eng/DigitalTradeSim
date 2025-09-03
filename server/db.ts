import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// Use the specific PostgreSQL connection string provided by user
const DATABASE_URL = "postgresql://user_replit_pos_fb6d057f:6f874b51b8bd77e859cac4c340a937d5@69.5.18.225:51821/replit_postgresql_1756917217105_7b26ed19";

export const connection = neon(DATABASE_URL);
export const db = drizzle(connection, { schema });