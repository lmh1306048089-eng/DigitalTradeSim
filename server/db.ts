import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// 使用PostgreSQL数据库连接 - 完全依赖环境变量
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required and not set');
}

let connectionConfig: any = {
  connectionString: DATABASE_URL,
  max: 10,
};

// Configure SSL based on environment 
const useSSL = process.env.DATABASE_SSL === 'true';
if (useSSL) {
  connectionConfig.ssl = { rejectUnauthorized: false };
} else {
  connectionConfig.ssl = false;
}

export const connection = new Pool(connectionConfig);

export const db = drizzle(connection, { schema });

// Health check function
export async function checkDatabaseHealth() {
  try {
    await connection.query('SELECT 1');
    console.log('✅ Database connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}