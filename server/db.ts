import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// Use environment variable for MySQL connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const connection = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit: 10,
});

export const db = drizzle(connection, { schema, mode: 'default' });