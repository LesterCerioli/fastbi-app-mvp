import { Pool } from "pg";
import mysql from "mysql2/promise";
import sql from "mssql";
import oracledb from "oracledb";
import { query } from "../db";
import { EncryptionService } from "./encryption_service";

interface DriverResult {
  rows: Record<string, unknown>[];
  fields: { name: string }[];
}

interface DriverClient {
  query(text: string, params?: unknown[]): Promise<DriverResult>;
  release(): void;
}

interface DriverPool {
  connect(): Promise<DriverClient>;
  end(): Promise<void>;
}

interface PoolOptions {
  max?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

interface DBDriver {
  getDriverName(): string;
  getConnectionString(config: Record<string, unknown>): string;
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] };
  applyLimit(query: string, maxRows: number): { query: string; applied: boolean };
  createPool(config: Record<string, unknown>, opts?: PoolOptions): Promise<DriverPool>;
}

class PostgresDriver implements DBDriver {
  getDriverName(): string { return "pg"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    return { query, params };
  }
  applyLimit(query: string, maxRows: number): { query: string; applied: boolean } {
    if (/\blimit\b/i.test(query)) return { query, applied: false };
    return { query: `${query} LIMIT ${maxRows}`, applied: true };
  }
  async createPool(config: Record<string, unknown>, opts: PoolOptions = {}): Promise<DriverPool> {
    const ssl = this.getSSLConfig(config.ssl_mode);
    const pool = new Pool({
      connectionString: this.getConnectionString(config),
      max: opts.max ?? 5,
      idleTimeoutMillis: opts.idleTimeoutMillis ?? 300000,
      connectionTimeoutMillis: opts.connectionTimeoutMillis ?? 8000,
      ...(ssl ? { ssl } : {}),
    });
    return {
      connect: async () => {
        const client = await pool.connect();
        return {
          query: async (text: string, params?: unknown[]) => {
            const result = await client.query(text, params);
            return { rows: result.rows, fields: result.fields };
          },
          release: () => client.release(),
        };
      },
      end: () => pool.end(),
    };
  }
  private getSSLConfig(sslMode: unknown): Record<string, unknown> | undefined {
    const mode = String(sslMode || "").toLowerCase();
    if (["verify-ca", "verify-full"].includes(mode)) {
      return { rejectUnauthorized: true };
    }
    if (["require", "prefer", "allow"].includes(mode)) {
      return { rejectUnauthorized: false };
    }
    return undefined;
  }
}

class MySQLDriver implements DBDriver {
  getDriverName(): string { return "mysql"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    const q = query.replace(/\$(\d+)/g, "?");
    return { query: q, params };
  }
  applyLimit(query: string, maxRows: number): { query: string; applied: boolean } {
    if (/\blimit\b/i.test(query)) return { query, applied: false };
    return { query: `${query} LIMIT ${maxRows}`, applied: true };
  }
  async createPool(config: Record<string, unknown>, opts: PoolOptions = {}): Promise<DriverPool> {
    const ssl = this.getSSLMode(config.ssl_mode);
    const pool = mysql.createPool({
      host: config.host as string,
      port: Number(config.port),
      user: config.username as string,
      password: config.password as string,
      database: config.database_name as string,
      connectionLimit: opts.max ?? 5,
      connectTimeout: opts.connectionTimeoutMillis ?? 8000,
      idleTimeout: opts.idleTimeoutMillis ?? 300000,
      ...(ssl ? { ssl } : {}),
    });
    return {
      connect: async () => {
        const conn = await pool.getConnection();
        return {
          query: async (text: string, params?: unknown[]) => {
            const [rows, fields] = await conn.query(text, params);
            return {
              rows: Array.isArray(rows)
                ? (rows as Record<string, unknown>[])
                : [],
              fields: ((fields as { name: string }[] | undefined) || []).map(
                (f) => ({ name: f.name })
              ),
            };
          },
          release: () => conn.release(),
        };
      },
      end: () => pool.end(),
    };
  }
  private getSSLMode(sslMode: unknown): string | undefined {
    const mode = String(sslMode || "").toLowerCase();
    switch (mode) {
      case "disable": return "DISABLED";
      case "allow": return "PREFERRED";
      case "prefer": return "PREFERRED";
      case "require": return "REQUIRED";
      case "verify-ca": return "VERIFY_CA";
      case "verify-full": return "VERIFY_IDENTITY";
      default: return undefined;
    }
  }
}

class SQLServerDriver implements DBDriver {
  getDriverName(): string { return "mssql"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `sqlserver://${config.username}:${config.password}@${config.host}:${config.port};database=${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    const q = query.replace(/\$(\d+)/g, (_, n) => `@p${n}`);
    return { query: q, params };
  }
  applyLimit(query: string, maxRows: number): { query: string; applied: boolean } {
    if (/\b(top|offset|fetch)\b/i.test(query)) return { query, applied: false };
    const match = query.match(/\bselect\b/i);
    if (!match || match.index === undefined) return { query, applied: false };
    return {
      query: `${query.slice(0, match.index + 6)} TOP (${maxRows})${query.slice(match.index + 6)}`,
      applied: true,
    };
  }
  async createPool(config: Record<string, unknown>, opts: PoolOptions = {}): Promise<DriverPool> {
    const sslMode = String(config.ssl_mode || "require").toLowerCase();
    const encrypt = sslMode !== "disable";
    const trustServerCertificate = ["require", "prefer", "allow"].includes(sslMode);
    const pool = new sql.ConnectionPool({
      server: config.host as string,
      port: Number(config.port),
      user: config.username as string,
      password: config.password as string,
      database: config.database_name as string,
      connectionTimeout: opts.connectionTimeoutMillis ?? 8000,
      requestTimeout: 60000,
      options: {
        encrypt,
        trustServerCertificate,
      },
      pool: {
        max: opts.max ?? 5,
        idleTimeoutMillis: opts.idleTimeoutMillis ?? 300000,
      },
    });
    try {
      await pool.connect();
    } catch (err) {
      await pool.close().catch(() => undefined);
      throw err;
    }
    return {
      connect: async () => {
        return {
          query: async (text: string, params?: unknown[]) => {
            const request = pool.request();
            (params || []).forEach((value, i) => {
              if (value === null || value === undefined) {
                request.input(`p${i + 1}`, sql.NVarChar, null);
              } else {
                request.input(`p${i + 1}`, value);
              }
            });
            const result = await request.query(text);
            const fields =
              result.recordset && result.recordset.columns
                ? Object.keys(result.recordset.columns).map((name) => ({ name }))
                : [];
            return {
              rows: (result.recordset as Record<string, unknown>[]) || [],
              fields,
            };
          },
          release: () => undefined,
        };
      },
      end: () => pool.close(),
    };
  }
}

class OracleDriver implements DBDriver {
  getDriverName(): string { return "oracle"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `${config.username}/${config.password}@${config.host}:${config.port}/${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    const q = query.replace(/\$(\d+)/g, ":$1");
    return { query: q, params };
  }
  applyLimit(query: string, maxRows: number): { query: string; applied: boolean } {
    if (/\b(fetch\s+first|rownum)\b/i.test(query)) return { query, applied: false };
    return { query: `${query} FETCH FIRST ${maxRows} ROWS ONLY`, applied: true };
  }
  async createPool(config: Record<string, unknown>, opts: PoolOptions = {}): Promise<DriverPool> {
    const pool = await oracledb.createPool({
      user: config.username as string,
      password: config.password as string,
      connectString: `${config.host}:${config.port}/${config.database_name}`,
      poolMax: opts.max ?? 5,
      poolMin: 0,
      poolIncrement: 1,
      poolTimeout: (opts.idleTimeoutMillis ?? 300000) / 1000,
      connectTimeout: opts.connectionTimeoutMillis ?? 8000,
      queueTimeout: 10000,
    });
    return {
      connect: async () => {
        const connection = await pool.getConnection();
        return {
          query: async (text: string, params?: unknown[]) => {
            const binds = (params || []).map((value) =>
              value === null || value === undefined
                ? { dir: oracledb.BIND_IN, type: oracledb.STRING, val: null }
                : value
            );
            const result =
              binds.length > 0
                ? await connection.execute(text, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    maxRows: Number(config.max_rows_limit) || 10000,
                  })
                : await connection.execute(text, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    maxRows: Number(config.max_rows_limit) || 10000,
                  });
            const rows = (result.rows || []) as Record<string, unknown>[];
            for (const row of rows) {
              for (const key of Object.keys(row)) {
                const value = row[key];
                if (
                  value &&
                  typeof value === "object" &&
                  typeof (value as { getData?: unknown }).getData === "function"
                ) {
                  row[key] = await (value as { getData(): Promise<unknown> }).getData();
                }
              }
            }
            const fields = (result.metaData || []).map(
              (m: { name: string }) => ({ name: m.name })
            );
            return { rows, fields };
          },
          release: () => {
            connection.close().catch(() => undefined);
          },
        };
      },
      end: () => pool.close(),
    };
  }
}

export class ClientConnectionService {
  private encryption: EncryptionService;
  private connectionPools: Map<string, DriverPool>;

  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
    this.connectionPools = new Map();
  }

  private getDriver(dbType: string): DBDriver | null {
    switch (dbType) {
      case "postgresql": case "postgres": return new PostgresDriver();
      case "mysql": case "mariadb": return new MySQLDriver();
      case "sqlserver": case "mssql": return new SQLServerDriver();
      case "oracle": return new OracleDriver();
      default: return null;
    }
  }

  private async getOrganizationIDByName(orgName: string): Promise<string | null> {
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [orgName]);
    return result.rows[0]?.id || null;
  }

  private async getOrganizationNameByID(orgID: string): Promise<string | null> {
    const result = await query(`SELECT name FROM public.organizations WHERE id = $1`, [orgID]);
    return result.rows[0]?.name || null;
  }

  async registerOrganizationConnection(
    organizationName: string, connectionName: string, host: string, port: number,
    databaseName: string, username: string, password: string, dbType: string, sslMode: string,
    maxRowsLimit: number, queryTimeoutSeconds: number
  ): Promise<Record<string, unknown>> {
    const orgID = await this.getOrganizationIDByName(organizationName);
    if (!orgID) throw new Error(`organization '${organizationName}' not found`);

    const finalDbType = dbType || "postgresql";
    const finalSslMode = sslMode || "require";
    const finalMaxRows = maxRowsLimit || 10000;
    const finalTimeout = queryTimeoutSeconds || 30;

    const driver = this.getDriver(finalDbType);
    if (!driver) throw new Error(`unsupported database type: ${finalDbType}`);

    await this.assertReachable(driver, {
      host, port, database_name: databaseName, username, password, ssl_mode: finalSslMode,
    });

    const encryptedPwd = this.encryption.encrypt(password);

    const result = await query(`
      INSERT INTO public.client_database_connections (
        organization_id, connection_name, db_type, host, port,
        database_name, username, password_encrypted, ssl_mode,
        max_rows_limit, query_timeout_seconds, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, organization_id, connection_name, host, port, database_name, created_at, is_active
    `, [orgID, connectionName, finalDbType, host, port, databaseName, username, encryptedPwd, finalSslMode, finalMaxRows, finalTimeout]);

    const row = result.rows[0];
    const orgName = await this.getOrganizationNameByID(row.organization_id);
    return { ...row, organization_name: orgName, db_type: finalDbType };
  }

  private async assertReachable(driver: DBDriver, config: Record<string, unknown>): Promise<void> {
    let pool: DriverPool | null = null;
    let client: DriverClient | null = null;
    try {
      pool = await driver.createPool(config, { max: 1, connectionTimeoutMillis: 5000 });
      client = await pool.connect();
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      let enhancedMessage = `Failed to connect to ${config.host}:${config.port}. Connection not saved. Reason: ${errorMessage}`;

      // Add helpful guidance for SSL errors
      if (errorMessage.toLowerCase().includes("ssl") || errorMessage.toLowerCase().includes("tls")) {
        const sslMode = String(config.ssl_mode || "require").toLowerCase();
        const host = String(config.host || "").toLowerCase();
        const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" ||
          host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.16.") ||
          host.startsWith("172.17.") || host.startsWith("172.18.") || host.startsWith("172.19.") ||
          host.startsWith("172.2") || host.startsWith("172.30.") || host.startsWith("172.31.");

        if (sslMode !== "disable" && isLocal) {
          enhancedMessage += "\n\nTip: You are connecting to a local address (localhost/private IP) with SSL enabled. " +
            "Local databases (Docker containers, local PostgreSQL) often don't have SSL configured. " +
            "Try changing SSL Mode to 'Disable' in the connection settings.";
        } else if (sslMode === "disable") {
          enhancedMessage += "\n\nTip: SSL is disabled but the server might require it. " +
            "Try changing SSL Mode to 'Require' or 'Prefer'.";
        }
      }

      throw new Error(enhancedMessage);
    } finally {
      if (client) { try { client.release(); } catch { /* noop */ } }
      if (pool) { await pool.end().catch(() => undefined); }
    }
  }

  async getConnectionConfig(connectionID: string): Promise<Record<string, unknown> | null> {
    if (!connectionID) return null;

    const result = await query(`
      SELECT id, organization_id, connection_name, db_type, host, port,
             database_name, username, password_encrypted, ssl_mode,
             max_rows_limit, query_timeout_seconds, is_active, created_at, last_used_at
      FROM public.client_database_connections
      WHERE id = $1 AND is_active = true
    `, [connectionID]);

    if (!result.rows[0]) return null;

    const row = result.rows[0];
    let password: string;
    try {
      password = this.encryption.decrypt(row.password_encrypted);
    } catch {
      return null;
    }
    const orgName = await this.getOrganizationNameByID(row.organization_id);

    const config: Record<string, unknown> = {
      id: row.id,
      organization_id: row.organization_id,
      organization_name: orgName,
      connection_name: row.connection_name,
      db_type: row.db_type,
      host: row.host,
      port: row.port,
      database_name: row.database_name,
      username: row.username,
      password,
      ssl_mode: row.ssl_mode,
      max_rows_limit: row.max_rows_limit,
      query_timeout_seconds: row.query_timeout_seconds,
      is_active: row.is_active,
      created_at: row.created_at,
    };
    if (row.last_used_at) config.last_used_at = row.last_used_at;
    return config;
  }

  async getOrganizationConnections(organizationName: string): Promise<Record<string, unknown>[]> {
    const orgID = await this.getOrganizationIDByName(organizationName);
    if (!orgID) return [];

    const result = await query(`
      SELECT id, connection_name, db_type, host, port, database_name,
             is_active, created_at, last_used_at, max_rows_limit, query_timeout_seconds
      FROM public.client_database_connections
      WHERE organization_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `, [orgID]);
    return result.rows;
  }

  async updateLastUsed(connectionID: string): Promise<void> {
    await query(
      `UPDATE public.client_database_connections SET last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [connectionID]
    );
  }

  async getOrCreatePool(connectionID: string): Promise<DriverPool> {
    const existing = this.connectionPools.get(connectionID);
    if (existing) return existing;

    const config = await this.getConnectionConfig(connectionID);
    if (!config) throw new Error(`connection ${connectionID} not found or inactive`);

    const dbType = config.db_type as string;
    const driver = this.getDriver(dbType);
    if (!driver) throw new Error(`unsupported database type: ${dbType}`);

    const pool = await driver.createPool(config, {
      max: 5,
      idleTimeoutMillis: 300000,
      connectionTimeoutMillis: 8000,
    });

    this.connectionPools.set(connectionID, pool);
    await this.updateLastUsed(connectionID);
    return pool;
  }

  async executeQuery(
    organizationName: string, connectionID: string, sqlQuery: string, params?: unknown[]
  ): Promise<Record<string, unknown>> {
    const orgID = await this.getOrganizationIDByName(organizationName);
    if (!orgID) return { success: false, error: `Organização '${organizationName}' não encontrada`, row_count: 0, data: [], columns: [] };

    const belongs = await this.validateConnectionBelongsToOrganization(connectionID, orgID);
    if (!belongs) return { success: false, error: "Conexão não pertence a esta organização", row_count: 0, data: [], columns: [] };

    const lowerQuery = sqlQuery.trim().toLowerCase();
    const blocked = ["drop", "truncate", "delete", "update", "insert", "alter", "create", "grant", "revoke", "vacuum", "reindex", "cluster", "analyze", "explain", "execute"];
    for (const kw of blocked) {
      if (new RegExp(`\\b${kw}\\b`).test(lowerQuery)) {
        return { success: false, error: `Query bloqueada: comando '${kw}' não é permitido`, row_count: 0, data: [], columns: [] };
      }
    }
    if (!lowerQuery.startsWith("select")) {
      return { success: false, error: "Apenas consultas SELECT são permitidas", row_count: 0, data: [], columns: [] };
    }

    const config = await this.getConnectionConfig(connectionID);
    if (!config) return { success: false, error: "Conexão não encontrada ou inativa", row_count: 0, data: [], columns: [] };

    const dbType = config.db_type as string;
    const driver = this.getDriver(dbType);
    if (!driver) return { success: false, error: `Tipo de banco não suportado: ${dbType}`, row_count: 0, data: [], columns: [] };

    const maxLimit = config.max_rows_limit as number;
    let finalQuery = sqlQuery.trim().replace(/;$/, "");
    const limitResult = driver.applyLimit(finalQuery, maxLimit);
    finalQuery = limitResult.query;
    const limitApplied = limitResult.applied;

    const adapted = driver.buildQuery(finalQuery, params || []);

    let client: DriverClient | null = null;
    try {
      const pool = await this.getOrCreatePool(connectionID);
      client = await pool.connect();
      const result = await client.query(adapted.query, adapted.params);
      await this.updateLastUsed(connectionID);

      return {
        success: true,
        row_count: result.rows.length,
        columns: result.fields.map((f) => f.name),
        data: result.rows,
        query_executed: adapted.query,
        connection_name: config.connection_name,
        organization_name: organizationName,
        db_type: dbType,
        limit_applied: limitApplied,
        ...(limitApplied ? { max_limit: maxLimit } : {}),
      };
    } catch (err: any) {
      return { success: false, error: `Erro na consulta: ${err.message}`, row_count: 0, data: [], columns: [] };
    } finally {
      client?.release();
    }
  }

  async testConnection(connectionID: string): Promise<Record<string, unknown>> {
    const config = await this.getConnectionConfig(connectionID);
    if (!config) return { success: false, error: "Conexão não encontrada" };

    const dbType = config.db_type as string;
    const driver = this.getDriver(dbType);
    if (!driver) return { success: false, error: `Driver não suportado: ${dbType}` };

    let pool: DriverPool | null = null;
    try {
      pool = await driver.createPool(config, {
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      const client = await pool.connect();
      client.release();
      await this.updateLastUsed(connectionID);
      return {
        success: true,
        message: `Conexão bem-sucedida com ${dbType}`,
        host: config.host,
        port: config.port,
        database: config.database_name,
        db_type: dbType,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      if (pool) await pool.end();
    }
  }

  async deleteConnection(connectionID: string): Promise<boolean> {
    const result = await query(
      `UPDATE public.client_database_connections SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING id`,
      [connectionID]
    );
    if (!result.rows[0]) return false;

    const pool = this.connectionPools.get(connectionID);
    if (pool) {
      await pool.end();
      this.connectionPools.delete(connectionID);
    }
    return true;
  }

  async getConnectionIDByName(organizationName: string, connectionName: string): Promise<string | null> {
    const orgID = await this.getOrganizationIDByName(organizationName);
    if (!orgID) throw new Error(`organization '${organizationName}' not found`);

    const result = await query(
      `SELECT id FROM public.client_database_connections WHERE organization_id = $1 AND connection_name = $2 AND is_active = true`,
      [orgID, connectionName]
    );
    return result.rows[0]?.id || null;
  }

  private async validateConnectionBelongsToOrganization(connectionID: string, orgID: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM public.client_database_connections WHERE id = $1 AND organization_id = $2 AND is_active = true`,
      [connectionID, orgID]
    );
    return result.rows.length > 0;
  }

  async getOrganizationConnectionStatistics(organizationName: string): Promise<Record<string, unknown>> {
    const orgID = await this.getOrganizationIDByName(organizationName);
    if (!orgID) {
      return { organization_name: organizationName, total_connections: 0, active_last_30_days: 0, never_used: 0, average_row_limit: 0, average_timeout_seconds: 0 };
    }

    const result = await query(`
      SELECT COUNT(*) AS total_connections,
             COUNT(CASE WHEN last_used_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS active_last_30d,
             COUNT(CASE WHEN last_used_at IS NULL THEN 1 END) AS never_used,
             COALESCE(AVG(max_rows_limit), 0) AS avg_row_limit,
             COALESCE(AVG(query_timeout_seconds), 0) AS avg_timeout
      FROM public.client_database_connections
      WHERE organization_id = $1 AND is_active = true
    `, [orgID]);

    const row = result.rows[0];
    return {
      organization_name: organizationName,
      total_connections: parseInt(row.total_connections, 10),
      active_last_30_days: parseInt(row.active_last_30d, 10),
      never_used: parseInt(row.never_used, 10),
      average_row_limit: parseFloat(row.avg_row_limit),
      average_timeout_seconds: parseFloat(row.avg_timeout),
    };
  }

  async getTableSchema(connectionID: string): Promise<Record<string, unknown>> {
    const config = await this.getConnectionConfig(connectionID);
    if (!config) {
      return { success: false, error: "Connection not found or inactive", tables: [] };
    }

    const dbType = config.db_type as string;
    const driver = this.getDriver(dbType);
    if (!driver) {
      return { success: false, error: `Unsupported database type: ${dbType}`, tables: [] };
    }

    const schemaQuery = this.buildSchemaQuery(dbType);
    if (!schemaQuery) {
      return { success: false, error: `Schema preview not supported for: ${dbType}`, tables: [] };
    }

    let client: DriverClient | null = null;
    try {
      const pool = await this.getOrCreatePool(connectionID);
      client = await pool.connect();
      const result = await client.query(schemaQuery);
      const tablesMap = new Map<string, { name: string; columns: Record<string, unknown>[] }>();
      for (const row of result.rows) {
        const tableName = row.table_name as string;
        if (!tablesMap.has(tableName)) {
          tablesMap.set(tableName, { name: tableName, columns: [] });
        }
        tablesMap.get(tableName)!.columns.push({
          name: row.column_name,
          data_type: row.data_type,
          max_length: row.character_maximum_length ?? row.character_max_length ?? null,
          nullable: row.is_nullable === "YES",
          default: row.column_default ?? row.data_default ?? null,
          is_primary_key: Boolean(row.is_primary_key),
          ordinal_position: row.ordinal_position,
        });
      }
      const tables = Array.from(tablesMap.values()).map((t) => ({
        ...t,
        columns: t.columns.sort(
          (a, b) => Number(a.ordinal_position) - Number(b.ordinal_position)
        ),
      }));
      return { success: true, tables };
    } catch (err: any) {
      return { success: false, error: `Failed to load schema: ${err.message}`, tables: [] };
    } finally {
      client?.release();
    }
  }

  private buildSchemaQuery(dbType: string): string | null {
    const base = dbType.toLowerCase();
    if (["postgresql", "postgres"].includes(base)) {
      return `
        SELECT t.table_name,
               c.column_name,
               c.ordinal_position,
               c.data_type,
               c.is_nullable,
               c.column_default,
               c.character_maximum_length,
               CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
        FROM information_schema.tables t
        JOIN information_schema.columns c
          ON c.table_schema = t.table_schema AND c.table_name = t.table_name
        LEFT JOIN (
          SELECT kcu.table_schema, kcu.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk
          ON pk.table_schema = t.table_schema AND pk.table_name = t.table_name AND pk.column_name = c.column_name
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position
      `;
    }
    if (["mysql", "mariadb"].includes(base)) {
      return `
        SELECT t.table_name,
               c.column_name,
               c.ordinal_position,
               c.data_type,
               c.is_nullable,
               c.column_default,
               c.character_maximum_length,
               CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
        FROM information_schema.tables t
        JOIN information_schema.columns c
          ON c.table_schema = t.table_schema AND c.table_name = t.table_name
        LEFT JOIN (
          SELECT kcu.table_schema, kcu.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk
          ON pk.table_schema = t.table_schema AND pk.table_name = t.table_name AND pk.column_name = c.column_name
        WHERE t.table_schema = DATABASE()
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position
      `;
    }
    if (["sqlserver", "mssql"].includes(base)) {
      return `
        SELECT t.table_name,
               c.column_name,
               c.ordinal_position,
               c.data_type,
               c.is_nullable,
               c.column_default,
               c.character_maximum_length,
               CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key
        FROM information_schema.tables t
        JOIN information_schema.columns c
          ON c.table_schema = t.table_schema AND c.table_name = t.table_name
        LEFT JOIN (
          SELECT kcu.table_schema, kcu.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk
          ON pk.table_schema = t.table_schema AND pk.table_name = t.table_name AND pk.column_name = c.column_name
        WHERE t.table_schema = 'dbo'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position
      `;
    }
    if (base === "oracle") {
      return `
        SELECT tc.table_name AS "table_name",
               tc.column_name AS "column_name",
               tc.column_id AS "ordinal_position",
               tc.data_type AS "data_type",
               CASE WHEN tc.nullable = 'Y' THEN 'YES' ELSE 'NO' END AS "is_nullable",
               tc.data_default AS "column_default",
               tc.data_length AS "character_maximum_length",
               CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END AS "is_primary_key"
        FROM all_tab_columns tc
        LEFT JOIN (
          SELECT ac.table_name, acc.column_name
          FROM all_constraints ac
          JOIN all_cons_columns acc
            ON ac.constraint_name = acc.constraint_name AND ac.owner = acc.owner
          WHERE ac.constraint_type = 'P'
        ) pk
          ON pk.table_name = tc.table_name AND pk.column_name = tc.column_name
        ORDER BY tc.table_name, tc.column_id
      `;
    }
    return null;
  }
}
