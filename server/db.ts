import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// 使用PostgreSQL数据库连接，添加SSL参数确保正确连接
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://user_replit_____b74dee61:3e3c478213fe04d01d0fced510bbb23d@69.5.18.225:51821/replit__________postgresql_1757986692198_78878d0b?sslmode=require";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

let connectionConfig: any = {
  connectionString: DATABASE_URL,
  max: 10,
};

// Configure SSL based on hostname rather than environment
const url = new URL(DATABASE_URL);
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
connectionConfig.ssl = isLocal ? false : { rejectUnauthorized: false };

export const connection = new Pool(connectionConfig);

export const db = drizzle(connection, { schema });