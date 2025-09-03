import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// MySQL connection string provided by user
const DATABASE_URL = "mysql://user_replit_mys_675c888c:0aca5b28c3cc25a65fbeb39e0e148e84@69.5.18.225:53186/replit_mysql_1756895070292_1df799a2";

export const connection = mysql.createPool({
  uri: DATABASE_URL,
});

export const db = drizzle(connection, { schema, mode: "default" });