import crypto from "crypto";
import { ClientConnectionService } from "./client_connection_service";

interface CacheEntry {
  data: Record<string, unknown>;
  cachedAt: number;
}

interface BatchQueryItem {
  connection_id: string;
  query: string;
  params?: unknown[];
}

export class QueryExecutorService {
  private clientConnection: ClientConnectionService;
  private resultCache: Map<string, CacheEntry>;

  constructor(clientConnection: ClientConnectionService) {
    this.clientConnection = clientConnection;
    this.resultCache = new Map();
  }

  private generateCacheKey(connectionID: string, queryStr: string, params?: unknown[]): string {
    const paramsJSON = JSON.stringify(params || []);
    const data = `${connectionID}:${queryStr}:${paramsJSON}`;
    return crypto.createHash("md5").update(data).digest("hex");
  }

  private getFromCache(cacheKey: string, ttlSeconds: number): Record<string, unknown> | null {
    const entry = this.resultCache.get(cacheKey);
    if (entry) {
      const now = Math.floor(Date.now() / 1000);
      if (now - entry.cachedAt < ttlSeconds) {
        return entry.data;
      }
      this.resultCache.delete(cacheKey);
    }
    return null;
  }

  private saveToCache(cacheKey: string, result: Record<string, unknown>): void {
    this.resultCache.set(cacheKey, {
      data: result,
      cachedAt: Math.floor(Date.now() / 1000),
    });
  }

  async execute(
    organizationName: string,
    connectionID: string,
    queryStr: string,
    params?: unknown[],
    useCache: boolean = false,
    cacheTTLSeconds: number = 300,
  ): Promise<Record<string, unknown>> {
    const startTime = Date.now();

    if (useCache) {
      const cacheKey = this.generateCacheKey(connectionID, queryStr, params);
      const cachedResult = this.getFromCache(cacheKey, cacheTTLSeconds);
      if (cachedResult) {
        cachedResult["from_cache"] = true;
        return cachedResult;
      }
    }

    const result = await this.clientConnection.executeQuery(
      organizationName,
      connectionID,
      queryStr,
      params,
    );

    const executionTimeMs = Date.now() - startTime;
    result["execution_time_ms"] = executionTimeMs;
    result["from_cache"] = false;

    if (useCache && result["success"] === true) {
      const cacheKey = this.generateCacheKey(connectionID, queryStr, params);
      this.saveToCache(cacheKey, result);
    }

    return result;
  }

  async executeBatch(
    organizationName: string,
    queries: BatchQueryItem[],
  ): Promise<Record<string, unknown>[]> {
    const results: Record<string, unknown>[] = [];
    for (const item of queries) {
      const result = await this.execute(
        organizationName,
        item.connection_id,
        item.query,
        item.params,
        false,
        0,
      );
      results.push(result);
    }
    return results;
  }

  async getTableSchema(
    organizationName: string,
    connectionID: string,
    tableName: string,
    schemaName: string = "public",
  ): Promise<Record<string, unknown>> {
    const querySQL = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = $1 
        AND table_name = $2
      ORDER BY ordinal_position
    `;

    const result = await this.clientConnection.executeQuery(
      organizationName,
      connectionID,
      querySQL,
      [schemaName, tableName],
    );

    if (result["success"] !== true) {
      return { success: false, error: result["error"] };
    }

    return {
      success: true,
      table_name: tableName,
      schema_name: schemaName,
      columns: result["data"],
      column_count: result["row_count"],
    };
  }

  async listTables(
    organizationName: string,
    connectionID: string,
    schemaName: string = "public",
  ): Promise<Record<string, unknown>> {
    const querySQL = `
      SELECT 
        table_name,
        table_type,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = $1 AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = $1
      ORDER BY table_name
    `;

    const result = await this.clientConnection.executeQuery(
      organizationName,
      connectionID,
      querySQL,
      [schemaName],
    );

    if (result["success"] !== true) {
      return { success: false, error: result["error"] };
    }

    return {
      success: true,
      schema_name: schemaName,
      tables: result["data"],
      table_count: result["row_count"],
    };
  }

  async validateQuery(
    organizationName: string,
    connectionID: string,
    queryStr: string,
  ): Promise<Record<string, unknown>> {
    const cleanQuery = queryStr.replace(/;+$/, "").trimEnd();
    const explainQuery = `EXPLAIN (FORMAT JSON) ${cleanQuery}`;

    const result = await this.clientConnection.executeQuery(
      organizationName,
      connectionID,
      explainQuery,
    );

    if (result["success"] !== true) {
      return { success: false, is_valid: false, error: result["error"] };
    }

    return {
      success: true,
      is_valid: true,
      explain_plan: result["data"],
      message: "Query syntax is valid",
    };
  }

  async estimateRowCount(
    organizationName: string,
    connectionID: string,
    queryStr: string,
  ): Promise<Record<string, unknown>> {
    const cleanQuery = queryStr.replace(/;+$/, "").trimEnd();
    const explainQuery = `EXPLAIN (FORMAT JSON) ${cleanQuery}`;

    const result = await this.clientConnection.executeQuery(
      organizationName,
      connectionID,
      explainQuery,
    );

    if (result["success"] !== true) {
      return { success: false, error: result["error"] };
    }

    const data = result["data"] as Record<string, unknown>[];
    if (!data || data.length === 0) {
      return { success: false, error: "Could not estimate row count" };
    }

    let estimatedRows = 0;
    const planData = data[0];
    const plan = planData["Plan"] as Record<string, unknown> | undefined;
    if (plan && typeof plan["Plan Rows"] === "number") {
      estimatedRows = plan["Plan Rows"] as number;
    }

    return {
      success: true,
      estimated_rows: estimatedRows,
      message: `Query estima retornar aproximadamente ${estimatedRows} linhas`,
    };
  }

  clearCache(): void {
    this.resultCache.clear();
    console.log("[INFO] Query result cache cleared");
  }

  getCacheStats(): Record<string, unknown> {
    return {
      cache_size: this.resultCache.size,
      cache_enabled: true,
    };
  }
}
