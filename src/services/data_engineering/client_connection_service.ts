import { Pool } from "pg";
import { query } from "../db";
import { EncryptionService } from "./encryption_service";

interface DBDriver {
  getDriverName(): string;
  getConnectionString(config: Record<string, unknown>): string;
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] };
}

class PostgresDriver implements DBDriver {
  getDriverName(): string { return "pg"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    return { query, params };
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
}

class SQLServerDriver implements DBDriver {
  getDriverName(): string { return "mssql"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `sqlserver://${config.username}:${config.password}@${config.host}:${config.port};database=${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    return { query, params };
  }
}

class OracleDriver implements DBDriver {
  getDriverName(): string { return "oracle"; }
  getConnectionString(config: Record<string, unknown>): string {
    return `${config.username}/${config.password}@${config.host}:${config.port}/${config.database_name}`;
  }
  buildQuery(query: string, params: unknown[]): { query: string; params: unknown[] } {
    const q = query.replace(/\$(\d+)/g, "?");
    return { query: q, params };
  }
}

export class ClientConnectionService {
  private encryption: EncryptionService;
  private connectionPools: Map<string, Pool>;

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

  async getOrCreatePool(connectionID: string): Promise<Pool> {
    const existing = this.connectionPools.get(connectionID);
    if (existing) return existing;

    const config = await this.getConnectionConfig(connectionID);
    if (!config) throw new Error(`connection ${connectionID} not found or inactive`);

    const dbType = config.db_type as string;
    const driver = this.getDriver(dbType);
    if (!driver) throw new Error(`unsupported database type: ${dbType}`);

    const connStr = driver.getConnectionString(config);
    const ssl = this.getSSLConfig(config.ssl_mode);
    const pool = new Pool({
      connectionString: connStr,
      max: 5,
      idleTimeoutMillis: 300000,
      ...(ssl ? { ssl } : {}),
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
    const limitApplied = !lowerQuery.includes("limit");
    if (limitApplied) finalQuery += ` LIMIT ${maxLimit}`;

    const adapted = driver.buildQuery(finalQuery, params || []);

    let client: import("pg").PoolClient | null = null;
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

    const connStr = driver.getConnectionString(config);
    const ssl = this.getSSLConfig(config.ssl_mode);
    const pool = new Pool({
      connectionString: connStr,
      max: 1,
      connectionTimeoutMillis: 5000,
      ...(ssl ? { ssl } : {}),
    });

    try {
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
      await pool.end();
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
}
