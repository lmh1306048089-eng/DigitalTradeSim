import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// 注意：当前环境提供MySQL数据库，但schema设计为PostgreSQL
// 临时使用PostgreSQL连接配置，实际使用内存存储
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