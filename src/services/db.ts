import { Pool } from "pg";

let pool: Pool | null = null;

function buildDatabaseUrl(): string {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const timezone = process.env.DB_TIMEZONE;
  if (host && user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return process.env.DATABASE_URL || "";
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = buildDatabaseUrl();
    if (!connectionString) {
      throw new Error(
        "Database connection string not configured. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME environment variables."
      );
    }
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function queryTx<T>(
  callback: (query: (text: string, params?: unknown[]) => Promise<any>) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback((text, params) => client.query(text, params));
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
