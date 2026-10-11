import mysql from "mysql2/promise";
import { mysqlSchema } from "./schema.mjs";

let pool;

export function databaseConfig(env = process.env) {
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  };
}

export function databaseConfigured(env = process.env) {
  const config = databaseConfig(env);
  return Boolean(config.host && config.database && config.user && config.password);
}

export function getPool(env = process.env) {
  if (!databaseConfigured(env)) return null;
  if (!pool) {
    pool = mysql.createPool({
      ...databaseConfig(env),
      waitForConnections: true,
      connectionLimit: Number(env.DB_CONNECTION_LIMIT || 10),
      namedPlaceholders: true,
      timezone: "Z",
    });
  }
  return pool;
}

export async function migrate(poolToUse = getPool()) {
  if (!poolToUse) {
    throw new Error("Missing DB_HOST, DB_NAME, DB_USER, or DB_PASSWORD.");
  }
  for (const statement of mysqlSchema) {
    await poolToUse.execute(statement);
  }
}

export async function withTransaction(poolToUse, callback) {
  const connection = await poolToUse.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
