import { query } from "../db";
import { ClientConnectionService } from "./client_connection_service";
import { EncryptionService } from "./encryption_service";

interface DriverClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; fields: { name: string }[] }>;
  release(): void;
}

export interface MigrationRecord {
  id: string;
  organization_id: string;
  source_connection_id: string;
  target_connection_id: string;
  source_db_type: string;
  target_db_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  tables_total: number;
  tables_completed: number;
  rows_migrated: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MigrationConfig {
  organization_name: string;
  source_connection_id: string;
  target_connection_id: string;
  options?: {
    include_indexes?: boolean;
    include_foreign_keys?: boolean;
    batch_size?: number;
  };
}

export interface MigrationProgress {
  migration_id: string;
  status: string;
  current_table: string | null;
  tables_completed: number;
  tables_total: number;
  rows_migrated: number;
  error: string | null;
}

interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primary_keys: string[];
  foreign_keys: ForeignKeySchema[];
  indexes: IndexSchema[];
}

interface ColumnSchema {
  name: string;
  data_type: string;
  max_length: number | null;
  nullable: boolean;
  default_value: string | null;
  is_primary_key: boolean;
  ordinal_position: number;
}

interface ForeignKeySchema {
  name: string;
  column: string;
  referenced_table: string;
  referenced_column: string;
}

interface IndexSchema {
  name: string;
  columns: string[];
  is_unique: boolean;
}

const TYPE_MAPPINGS: Record<string, Record<string, string>> = {
  postgresql: {
    'uuid': 'uuid',
    'jsonb': 'jsonb',
    'timestamp with time zone': 'timestamptz',
    'timestamp without time zone': 'timestamp',
    'character varying': 'varchar',
    'character': 'char',
    'text': 'text',
    'integer': 'integer',
    'bigint': 'bigint',
    'smallint': 'smallint',
    'numeric': 'numeric',
    'real': 'real',
    'double precision': 'double precision',
    'boolean': 'boolean',
    'date': 'date',
    'time with time zone': 'timetz',
    'time without time zone': 'time',
    'array': 'text[]',
    'text[]': 'text[]',
    'integer[]': 'integer[]',
    'bigint[]': 'bigint[]',
    'smallint[]': 'smallint[]',
    'uuid[]': 'uuid[]',
    'numeric[]': 'numeric[]',
    'real[]': 'real[]',
    'double precision[]': 'double precision[]',
    'boolean[]': 'boolean[]',
    'date[]': 'date[]',
    'timestamp[]': 'timestamp[]',
    'timestamptz[]': 'timestamptz[]',
  },
  mysql: {
    'uuid': 'char(36)',
    'jsonb': 'json',
    'timestamp with time zone': 'datetime',
    'timestamp without time zone': 'datetime',
    'character varying': 'varchar',
    'character': 'char',
    'text': 'text',
    'integer': 'int',
    'bigint': 'bigint',
    'smallint': 'smallint',
    'numeric': 'decimal',
    'real': 'float',
    'double precision': 'double',
    'boolean': 'tinyint(1)',
    'date': 'date',
    'time with time zone': 'time',
    'time without time zone': 'time',
    'array': 'json',
    'text[]': 'json',
    'integer[]': 'json',
    'bigint[]': 'json',
    'uuid[]': 'json',
    'numeric[]': 'json',
    'real[]': 'json',
    'double precision[]': 'json',
    'boolean[]': 'json',
    'date[]': 'json',
    'timestamp[]': 'json',
  },
  mssql: {
    'uuid': 'uniqueidentifier',
    'jsonb': 'nvarchar(max)',
    'timestamp with time zone': 'datetimeoffset',
    'timestamp without time zone': 'datetime2',
    'character varying': 'nvarchar',
    'character': 'nchar',
    'text': 'nvarchar(max)',
    'integer': 'int',
    'bigint': 'bigint',
    'smallint': 'smallint',
    'numeric': 'decimal',
    'real': 'real',
    'double precision': 'float',
    'boolean': 'bit',
    'date': 'date',
    'time with time zone': 'time',
    'time without time zone': 'time',
    'array': 'nvarchar(max)',
    'text[]': 'nvarchar(max)',
    'integer[]': 'nvarchar(max)',
    'bigint[]': 'nvarchar(max)',
    'uuid[]': 'nvarchar(max)',
    'numeric[]': 'nvarchar(max)',
    'real[]': 'nvarchar(max)',
    'double precision[]': 'nvarchar(max)',
    'boolean[]': 'nvarchar(max)',
    'date[]': 'nvarchar(max)',
    'timestamp[]': 'nvarchar(max)',
  },
  oracle: {
    'uuid': 'raw(16)',
    'jsonb': 'blob',
    'timestamp with time zone': 'timestamp with time zone',
    'timestamp without time zone': 'timestamp',
    'character varying': 'varchar2',
    'character': 'char',
    'text': 'clob',
    'integer': 'number(10)',
    'bigint': 'number(19)',
    'smallint': 'number(5)',
    'numeric': 'number',
    'real': 'binary_float',
    'double precision': 'binary_double',
    'boolean': 'number(1)',
    'date': 'date',
    'time with time zone': 'timestamp with time zone',
    'time without time zone': 'timestamp',
    'array': 'clob',
    'text[]': 'clob',
    'integer[]': 'clob',
    'bigint[]': 'clob',
    'uuid[]': 'clob',
    'numeric[]': 'clob',
    'real[]': 'clob',
    'double precision[]': 'clob',
    'boolean[]': 'clob',
    'date[]': 'clob',
    'timestamp[]': 'clob',
  },
};

export class MigrationService {
  private clientConnService: ClientConnectionService;
  private encryption: EncryptionService;
  private runningMigrations: Map<string, AbortController> = new Map();

  constructor(clientConnService: ClientConnectionService, encryption: EncryptionService) {
    this.clientConnService = clientConnService;
    this.encryption = encryption;
  }

  async validateMigration(config: MigrationConfig): Promise<{ valid: boolean; error?: string }> {
    const orgID = await this.getOrganizationIDByName(config.organization_name);
    if (!orgID) {
      return { valid: false, error: `Organization '${config.organization_name}' not found` };
    }

    const sourceConfig = await this.clientConnService.getConnectionConfig(config.source_connection_id);
    if (!sourceConfig) {
      return { valid: false, error: 'Source connection not found or inactive' };
    }

    const targetConfig = await this.clientConnService.getConnectionConfig(config.target_connection_id);
    if (!targetConfig) {
      return { valid: false, error: 'Target connection not found or inactive' };
    }

    if (sourceConfig.organization_id !== orgID) {
      return { valid: false, error: 'Source connection does not belong to this organization' };
    }

    if (targetConfig.organization_id !== orgID) {
      return { valid: false, error: 'Target connection does not belong to this organization' };
    }

    if (config.source_connection_id === config.target_connection_id) {
      return { valid: false, error: 'Source and target connections must be different' };
    }

    return { valid: true };
  }

  async createMigration(config: MigrationConfig): Promise<MigrationRecord> {
    const validation = await this.validateMigration(config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const sourceConfig = await this.clientConnService.getConnectionConfig(config.source_connection_id);
    const targetConfig = await this.clientConnService.getConnectionConfig(config.target_connection_id);

    if (!sourceConfig || !targetConfig) {
      throw new Error('Connection configuration not found');
    }

    const result = await query(`
      INSERT INTO public.database_migrations (
        organization_id, source_connection_id, target_connection_id,
        source_db_type, target_db_type, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      sourceConfig.organization_id,
      config.source_connection_id,
      config.target_connection_id,
      sourceConfig.db_type,
      targetConfig.db_type,
    ]);

    return this.mapRowToMigration(result.rows[0]);
  }

  async getMigration(migrationId: string): Promise<MigrationRecord | null> {
    const result = await query(`SELECT * FROM public.database_migrations WHERE id = $1`, [migrationId]);
    if (!result.rows[0]) return null;
    return this.mapRowToMigration(result.rows[0]);
  }

  async getMigrationHistory(
    organizationName: string,
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<{ migrations: MigrationRecord[]; total: number }> {
    const orgID = await this.getOrganizationIDByName(organizationName);
    if (!orgID) return { migrations: [], total: 0 };

    let whereClause = 'WHERE dm.organization_id = $1';
    const params: unknown[] = [orgID];
    let paramIndex = 2;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM public.database_migrations dm ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    let queryStr = `
      SELECT dm.*, 
        sc.connection_name as source_name, sc.db_type as source_db_type,
        tc.connection_name as target_name, tc.db_type as target_db_type
      FROM public.database_migrations dm
      LEFT JOIN public.client_database_connections sc ON dm.source_connection_id = sc.id
      LEFT JOIN public.client_database_connections tc ON dm.target_connection_id = tc.id
      ${whereClause}
      ORDER BY dm.created_at DESC
    `;

    if (filters?.limit) {
      queryStr += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }
    if (filters?.offset) {
      queryStr += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await query(queryStr, params);
    return {
      migrations: result.rows.map(this.mapRowToMigration),
      total,
    };
  }

  async startMigration(migrationId: string): Promise<void> {
    const migration = await this.getMigration(migrationId);
    if (!migration) throw new Error('Migration not found');
    if (migration.status !== 'pending') throw new Error(`Migration is ${migration.status}, cannot start`);

    console.log(`[Migration ${migrationId}] Setting status to running`);
    await this.updateMigration(migrationId, { status: 'running', started_at: new Date().toISOString() });

    const controller = new AbortController();
    this.runningMigrations.set(migrationId, controller);

    this.executeMigration(migrationId, controller.signal).catch(err => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Migration ${migrationId}] Background migration failed:`, errorMessage);
      this.updateMigration(migrationId, {
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      }).catch(e => console.error(`[Migration ${migrationId}] Failed to update status to failed:`, e));
    });
  }

  async cancelMigration(migrationId: string): Promise<boolean> {
    const controller = this.runningMigrations.get(migrationId);
    if (controller) {
      controller.abort();
      this.runningMigrations.delete(migrationId);
    }

    const migration = await this.getMigration(migrationId);
    if (!migration) return false;
    if (migration.status !== 'running' && migration.status !== 'pending') return false;

    await this.updateMigration(migrationId, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    });
    return true;
  }

  async retryMigration(migrationId: string): Promise<void> {
    const migration = await this.getMigration(migrationId);
    if (!migration) throw new Error('Migration not found');
    if (migration.status !== 'failed' && migration.status !== 'cancelled') {
      throw new Error(`Cannot retry migration with status: ${migration.status}`);
    }

    await this.updateMigration(migrationId, {
      status: 'pending',
      error_message: null,
      tables_completed: 0,
      rows_migrated: 0,
      started_at: null,
      completed_at: null,
    });

    await this.startMigration(migrationId);
  }

  private async executeMigration(migrationId: string, signal: AbortSignal): Promise<void> {
    const migration = await this.getMigration(migrationId);
    if (!migration) return;

    console.log(`[Migration ${migrationId}] Starting migration from ${migration.source_connection_id} to ${migration.target_connection_id}`);

    try {
      const sourceConfig = await this.clientConnService.getConnectionConfig(migration.source_connection_id);
      const targetConfig = await this.clientConnService.getConnectionConfig(migration.target_connection_id);
      if (!sourceConfig || !targetConfig) throw new Error('Connection config not found');

      console.log(`[Migration ${migrationId}] Got connection configs, creating pools...`);

      const sourcePool = await this.clientConnService.getOrCreatePool(migration.source_connection_id);
      const targetPool = await this.clientConnService.getOrCreatePool(migration.target_connection_id);

      const sourceClient = await sourcePool.connect();
      const targetClient = await targetPool.connect();

      console.log(`[Migration ${migrationId}] Connected to both databases, extracting schema...`);

      try {
        const schema = await this.extractSchema(sourceClient, sourceConfig.db_type as string);
        console.log(`[Migration ${migrationId}] Schema extracted: ${schema.length} tables`);
        console.log(`[Migration ${migrationId}] Tables:`, schema.map(t => t.name).join(', '));
        await this.updateMigration(migrationId, { tables_total: schema.length });

        const failedTables: string[] = [];

        // First pass: Create tables and copy data
        for (let i = 0; i < schema.length; i++) {
          if (signal.aborted) throw new Error('Migration cancelled');

          const table = schema[i];
          console.log(`[Migration ${migrationId}] Migrating table ${i + 1}/${schema.length}: ${table.name}`);
          
          try {
            await this.migrateTable(
              sourceClient,
              targetClient,
              table,
              sourceConfig.db_type as string,
              targetConfig.db_type as string,
              migrationId
            );
          } catch (tableErr) {
            const errorMessage = tableErr instanceof Error ? tableErr.message : String(tableErr);
            console.error(`[Migration ${migrationId}] Failed to migrate table ${table.name}:`, errorMessage);
            failedTables.push(`${table.name}: ${errorMessage}`);
            // Continue with next table
          }

          await this.updateMigration(migrationId, {
            tables_completed: i + 1,
          });
        }

        // Second pass: Create foreign keys (after all tables exist)
        if (sourceConfig.db_type === 'postgresql' || sourceConfig.db_type === 'postgres') {
          console.log(`[Migration ${migrationId}] Creating foreign keys...`);
          try {
            await this.createForeignKeys(targetClient, schema, targetConfig.db_type as string, migrationId);
          } catch (fkErr) {
            console.error(`[Migration ${migrationId}] Foreign key creation failed:`, fkErr);
          }
        }

        // Third pass: Create indexes
        if (sourceConfig.db_type === 'postgresql' || sourceConfig.db_type === 'postgres') {
          console.log(`[Migration ${migrationId}] Creating indexes...`);
          try {
            await this.createIndexes(targetClient, schema, targetConfig.db_type as string, migrationId);
          } catch (idxErr) {
            console.error(`[Migration ${migrationId}] Index creation failed:`, idxErr);
          }
        }

        const finalStatus = failedTables.length > 0 ? 'completed' : 'completed';
        await this.updateMigration(migrationId, {
          status: finalStatus,
          completed_at: new Date().toISOString(),
          error_message: failedTables.length > 0 ? `Some tables failed: ${failedTables.join('; ')}` : null,
        });
        
        if (failedTables.length > 0) {
          console.warn(`[Migration ${migrationId}] Completed with ${failedTables.length} table(s) failed:`, failedTables);
        } else {
          console.log(`[Migration ${migrationId}] Migration completed successfully`);
        }
      } finally {
        sourceClient.release();
        targetClient.release();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Migration ${migrationId}] Migration failed:`, errorMessage);
      
      if (signal.aborted) {
        await this.updateMigration(migrationId, {
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        });
      } else {
        throw err;
      }
    } finally {
      this.runningMigrations.delete(migrationId);
    }
  }

  private async extractSchema(client: DriverClient, dbType: string): Promise<TableSchema[]> {
    const schemaQuery = this.buildSchemaQuery(dbType);
    const result = await client.query(schemaQuery);

    const tablesMap = new Map<string, TableSchema>();

    for (const row of result.rows) {
      const tableName = row.table_name as string;
      if (!tablesMap.has(tableName)) {
        tablesMap.set(tableName, {
          name: tableName,
          columns: [],
          primary_keys: [],
          foreign_keys: [],
          indexes: [],
        });
      }

      const table = tablesMap.get(tableName)!;

      table.columns.push({
        name: row.column_name as string,
        data_type: row.data_type as string,
        max_length: (row.character_maximum_length as number) ?? null,
        nullable: row.is_nullable === 'YES',
        default_value: (row.column_default as string) ?? null,
        is_primary_key: Boolean(row.is_primary_key),
        ordinal_position: row.ordinal_position as number,
      });

      if (row.is_primary_key && !table.primary_keys.includes(row.column_name as string)) {
        table.primary_keys.push(row.column_name as string);
      }
    }

    if (dbType === 'postgresql' || dbType === 'postgres') {
      const fkResult = await client.query(`
        SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      `);
      for (const row of fkResult.rows) {
        const table = tablesMap.get(row.table_name as string);
        if (table) {
          table.foreign_keys.push({
            name: row.constraint_name as string,
            column: row.column_name as string,
            referenced_table: row.referenced_table as string,
            referenced_column: row.referenced_column as string,
          });
        }
      }

      const idxResult = await client.query(`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
      `);
      for (const row of idxResult.rows) {
        const table = tablesMap.get(row.tablename as string);
        if (table) {
          const indexDef = row.indexdef as string;
          const cols = indexDef.match(/\(([^)]+)\)/);
          table.indexes.push({
            name: row.indexname as string,
            columns: cols ? cols[1].split(',').map((c: string) => c.trim()) : [],
            is_unique: indexDef.includes('UNIQUE'),
          });
        }
      }
    }

    return Array.from(tablesMap.values()).map(t => ({
      ...t,
      columns: t.columns.sort((a, b) => a.ordinal_position - b.ordinal_position),
    }));
  }

  private buildSchemaQuery(dbType: string): string {
    const base = dbType.toLowerCase();
    if (['postgresql', 'postgres'].includes(base)) {
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
    if (['mysql', 'mariadb'].includes(base)) {
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
    if (['sqlserver', 'mssql'].includes(base)) {
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
    if (base === 'oracle') {
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
    throw new Error(`Schema extraction not supported for: ${dbType}`);
  }

  private async migrateTable(
    sourceClient: DriverClient,
    targetClient: DriverClient,
    table: TableSchema,
    sourceDbType: string,
    targetDbType: string,
    migrationId: string
  ): Promise<void> {
    console.log(`[Migration ${migrationId}] Creating table ${table.name} in target...`);
    const createTableSQL = this.buildCreateTableSQL(table, targetDbType);
    await targetClient.query(createTableSQL);
    console.log(`[Migration ${migrationId}] Table ${table.name} created successfully`);

    const countResult = await sourceClient.query(`SELECT COUNT(*) FROM ${this.quoteIdentifier(table.name, sourceDbType)}`);
    console.log(`[Migration ${migrationId}] Count result:`, JSON.stringify(countResult.rows[0]));
    const countValue = countResult.rows[0]?.count ?? countResult.rows[0]?.['COUNT(*)'] ?? countResult.rows[0]?.['count(*)'] ?? Object.values(countResult.rows[0] || {})[0];
    const totalRows = parseInt(String(countValue || 0), 10) || 0;
    console.log(`[Migration ${migrationId}] Table ${table.name} has ${totalRows} rows to migrate`);

    if (totalRows === 0) return;

    const batchSize = 1000;
    let offset = 0;
    let migrated = 0;

    while (offset < totalRows) {
      const paginatedQuery = this.buildPaginatedQuery(table.name, sourceDbType, batchSize, offset);
      const sourceRows = await sourceClient.query(paginatedQuery.query, paginatedQuery.params);

      if (sourceRows.rows.length === 0) break;

      console.log(`[Migration ${migrationId}] Inserting batch of ${sourceRows.rows.length} rows into ${table.name}...`);
      try {
        await this.insertBatch(targetClient, table, sourceRows.rows, targetDbType);
      } catch (insertErr) {
        const errorMessage = insertErr instanceof Error ? insertErr.message : String(insertErr);
        console.error(`[Migration ${migrationId}] Failed to insert batch into ${table.name}:`, errorMessage);
        throw insertErr;
      }
      migrated += sourceRows.rows.length;
      offset += batchSize;

      await this.updateMigration(migrationId, { rows_migrated: migrated });
      console.log(`[Migration ${migrationId}] Migrated ${migrated}/${totalRows} rows for ${table.name}`);
    }
  }

  private buildPaginatedQuery(tableName: string, dbType: string, limit: number, offset: number): { query: string; params: unknown[] } {
    const quotedTable = this.quoteIdentifier(tableName, dbType);
    const base = dbType.toLowerCase();

    if (['postgresql', 'postgres', 'mysql', 'mariadb'].includes(base)) {
      return {
        query: `SELECT * FROM ${quotedTable} ORDER BY 1 LIMIT $1 OFFSET $2`,
        params: [limit, offset],
      };
    }

    if (['mssql', 'sqlserver'].includes(base)) {
      return {
        query: `SELECT * FROM ${quotedTable} ORDER BY 1 OFFSET @p1 ROWS FETCH NEXT @p2 ROWS ONLY`,
        params: [offset, limit],
      };
    }

    if (base === 'oracle') {
      return {
        query: `SELECT * FROM ${quotedTable} ORDER BY 1 OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
        params: [offset, limit],
      };
    }

    return {
      query: `SELECT * FROM ${quotedTable} ORDER BY 1 LIMIT $1 OFFSET $2`,
      params: [limit, offset],
    };
  }

  private buildCreateTableSQL(table: TableSchema, targetDbType: string): string {
    const cols = table.columns.map(col => {
      const mappedType = this.mapDataType(col.data_type, targetDbType);
      let colDef = `${this.quoteIdentifier(col.name, targetDbType)} ${mappedType}`;
      if (!col.nullable) colDef += ' NOT NULL';
      if (col.default_value && targetDbType !== 'oracle') {
        const defaultValue = this.sanitizeDefaultValue(col.default_value, targetDbType);
        if (defaultValue) colDef += ` DEFAULT ${defaultValue}`;
      }
      return colDef;
    });

    let sql = `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(table.name, targetDbType)} (${cols.join(', ')}`;

    if (table.primary_keys.length > 0) {
      const pkCols = table.primary_keys.map(c => this.quoteIdentifier(c, targetDbType)).join(', ');
      sql += `, PRIMARY KEY (${pkCols})`;
    }

    sql += ')';
    return sql;
  }

  private sanitizeDefaultValue(defaultValue: string, targetDbType: string): string | null {
    const dv = defaultValue.trim();
    
    // Skip PostgreSQL-specific functions that require extensions
    const pgSpecificFunctions = [
      'uuid_generate_v4()',
      'gen_random_uuid()',
      'nextval(',
      'currval(',
      'lastval(',
    ];
    
    // Check if it's a PostgreSQL-specific function
    for (const fn of pgSpecificFunctions) {
      if (dv.startsWith(fn)) {
        console.log(`[Migration] Skipping PostgreSQL-specific default: ${dv}`);
        return null;
      }
    }
    
    // For cross-DB migrations, skip sequence defaults
    if (targetDbType !== 'postgresql' && targetDbType !== 'postgres') {
      if (dv.startsWith('nextval(') || dv.includes('::regclass')) {
        return null;
      }
    }
    
    // Keep simple defaults: literals, CURRENT_TIMESTAMP, NOW(), etc.
    const allowedDefaults = [
      'CURRENT_TIMESTAMP',
      'CURRENT_DATE', 
      'CURRENT_TIME',
      'NOW()',
      'LOCALTIMESTAMP',
      'LOCALTIME',
    ];
    
    const upperDv = dv.toUpperCase();
    for (const allowed of allowedDefaults) {
      if (upperDv.startsWith(allowed)) {
        return defaultValue;
      }
    }
    
    // Keep numeric/string literals
    if (/^['"](.*)['"]$/.test(dv) || /^-?\d+(\.\d+)?$/.test(dv)) {
      return defaultValue;
    }
    
    // Skip complex expressions for cross-DB compatibility
    console.log(`[Migration] Skipping complex default value: ${dv}`);
    return null;
  }

  private mapDataType(sourceType: string, targetDbType: string): string {
    const sourceLower = sourceType.toLowerCase();
    const mappings = TYPE_MAPPINGS[targetDbType] || TYPE_MAPPINGS.postgresql;
    
    // Handle array types (e.g., text[], integer[], uuid[])
    if (sourceLower.endsWith('[]')) {
      const baseType = sourceLower.slice(0, -2);
      if (mappings[sourceLower]) {
        return mappings[sourceLower];
      }
      if (mappings[baseType]) {
        // For PostgreSQL, arrays keep the base type with []
        if (targetDbType === 'postgresql' || targetDbType === 'postgres') {
          return `${mappings[baseType]}[]`;
        }
        // For other DBs, use the array mapping or fallback to JSON/text
        return mappings['array'] || mappings['text[]'] || 'text';
      }
      return mappings['array'] || 'text';
    }
    
    return mappings[sourceLower] || sourceType;
  }

  private quoteIdentifier(name: string, dbType: string): string {
    if (dbType === 'mysql' || dbType === 'mariadb') return `\`${name}\``;
    if (dbType === 'mssql' || dbType === 'sqlserver') return `[${name}]`;
    if (dbType === 'oracle') return `"${name.toUpperCase()}"`;
    return `"${name}"`;
  }

  private async insertBatch(targetClient: DriverClient, table: TableSchema, rows: Record<string, unknown>[], targetDbType: string): Promise<void> {
    if (rows.length === 0) return;

    const columns = table.columns.map(c => this.quoteIdentifier(c.name, targetDbType));
    const pkColumns = table.primary_keys.map(c => this.quoteIdentifier(c, targetDbType));
    const rowCount = rows.length;
    const placeholders = rows.map((_, i) =>
      '(' + columns.map((_, j) => this.getPlaceholder(targetDbType, i * columns.length + j + 1)).join(', ') + ')'
    ).join(', ');

    const values = rows.flatMap(row => table.columns.map(c => row[c.name]));
    const sql = this.buildUpsertSQL(table.name, columns, pkColumns, placeholders, targetDbType, rowCount);
    
    console.log(`[Migration] Insert SQL: ${sql.substring(0, 500)}...`);
    console.log(`[Migration] Values count: ${values.length}`);
    await targetClient.query(sql, values);
  }

  private buildUpsertSQL(
    tableName: string,
    columns: string[],
    pkColumns: string[],
    placeholders: string,
    targetDbType: string,
    rowCount: number
  ): string {
    const quotedTable = this.quoteIdentifier(tableName, targetDbType);
    const colList = columns.join(', ');

    const dbType = targetDbType.toLowerCase();

    let sql: string;

    if (['postgresql', 'postgres'].includes(dbType)) {
      if (pkColumns.length > 0) {
        const conflictCols = pkColumns.join(', ');
        sql = `INSERT INTO ${quotedTable} (${colList}) VALUES ${placeholders} ON CONFLICT (${conflictCols}) DO NOTHING`;
      } else {
        sql = `INSERT INTO ${quotedTable} (${colList}) VALUES ${placeholders}`;
      }
    } else if (['mysql', 'mariadb'].includes(dbType)) {
      sql = `INSERT IGNORE INTO ${quotedTable} (${colList}) VALUES ${placeholders}`;
    } else if (['mssql', 'sqlserver'].includes(dbType)) {
      if (pkColumns.length > 0) {
        const matchCols = pkColumns.map(c => `TARGET.${c} = SOURCE.${c}`).join(' AND ');
        const sourceAlias = 'SOURCE';
        const targetAlias = 'TARGET';
        sql = `
          MERGE INTO ${quotedTable} AS ${targetAlias}
          USING (VALUES ${placeholders}) AS ${sourceAlias} (${colList})
          ON ${matchCols}
          WHEN NOT MATCHED THEN
            INSERT (${colList}) VALUES (${colList.split(', ').map(c => `${sourceAlias}.${c.trim()}`).join(', ')})
        `.trim();
      } else {
        sql = `INSERT INTO ${quotedTable} (${colList}) VALUES ${placeholders}`;
      }
    } else if (dbType === 'oracle') {
      if (pkColumns.length > 0) {
        const matchCols = pkColumns.map(c => `TARGET.${c} = SOURCE.${c}`).join(' AND ');
        const oraclePlaceholders = Array.from({ length: rowCount }, (_, i) =>
          '(' + columns.map((_, j) => `:${i * columns.length + j + 1}`).join(', ') + ')'
        ).join(', ');
        sql = `
          MERGE INTO ${quotedTable} TARGET
          USING (SELECT ${oraclePlaceholders} FROM DUAL) SOURCE
          ON (${matchCols})
          WHEN NOT MATCHED THEN
            INSERT (${colList}) VALUES (${colList.split(', ').map(c => `SOURCE.${c.trim()}`).join(', ')})
        `.trim();
      } else {
        sql = `INSERT INTO ${quotedTable} (${colList}) VALUES ${placeholders}`;
      }
    } else {
      sql = `INSERT INTO ${quotedTable} (${colList}) VALUES ${placeholders}`;
    }

    console.log(`[Migration] Generated upsert SQL for ${tableName}: ${sql.substring(0, 500)}...`);
    return sql;
  }

  private getPlaceholder(dbType: string, index: number): string {
    if (dbType === 'mssql' || dbType === 'sqlserver') return `@p${index}`;
    if (dbType === 'oracle') return `:${index}`;
    if (dbType === 'mysql' || dbType === 'mariadb') return '?';
    return `$${index}`;
  }

  private async updateMigration(migrationId: string, updates: Partial<MigrationRecord>): Promise<void> {
    const setClause: string[] = [];
    const params: unknown[] = [migrationId];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${dbKey} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);

    await query(
      `UPDATE public.database_migrations SET ${setClause.join(', ')} WHERE id = $1`,
      params
    );
  }

  private async getOrganizationIDByName(orgName: string): Promise<string | null> {
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [orgName]);
    return result.rows[0]?.id || null;
  }

  private mapRowToMigration(row: Record<string, unknown>): MigrationRecord {
    return {
      id: row.id as string,
      organization_id: row.organization_id as string,
      source_connection_id: row.source_connection_id as string,
      target_connection_id: row.target_connection_id as string,
      source_db_type: row.source_db_type as string,
      target_db_type: row.target_db_type as string,
      status: row.status as MigrationRecord['status'],
      tables_total: (row.tables_total as number) || 0,
      tables_completed: (row.tables_completed as number) || 0,
      rows_migrated: (row.rows_migrated as number) || 0,
      error_message: row.error_message as string | null,
      started_at: row.started_at as string | null,
      completed_at: row.completed_at as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  private async createForeignKeys(targetClient: DriverClient, schema: TableSchema[], targetDbType: string, migrationId: string): Promise<void> {
    const dbType = targetDbType.toLowerCase();
    
    for (const table of schema) {
      for (const fk of table.foreign_keys) {
        try {
          const fkName = this.quoteIdentifier(`fk_${table.name}_${fk.column}`, targetDbType);
          const tableName = this.quoteIdentifier(table.name, targetDbType);
          const refTable = this.quoteIdentifier(fk.referenced_table, targetDbType);
          const col = this.quoteIdentifier(fk.column, targetDbType);
          const refCol = this.quoteIdentifier(fk.referenced_column, targetDbType);
          
          let sql: string;
          
          if (['postgresql', 'postgres'].includes(dbType)) {
            sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${col}) REFERENCES ${refTable} (${refCol})`;
          } else if (['mysql', 'mariadb'].includes(dbType)) {
            sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${col}) REFERENCES ${refTable} (${refCol})`;
          } else if (['mssql', 'sqlserver'].includes(dbType)) {
            sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${col}) REFERENCES ${refTable} (${refCol})`;
          } else if (dbType === 'oracle') {
            sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${col}) REFERENCES ${refTable} (${refCol})`;
          } else {
            continue;
          }
          
          console.log(`[Migration ${migrationId}] Creating FK: ${sql}`);
          await targetClient.query(sql);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.warn(`[Migration ${migrationId}] FK creation failed for ${table.name}.${fk.column}:`, errorMessage);
        }
      }
    }
  }

  private async createIndexes(targetClient: DriverClient, schema: TableSchema[], targetDbType: string, migrationId: string): Promise<void> {
    const dbType = targetDbType.toLowerCase();
    
    for (const table of schema) {
      for (const idx of table.indexes) {
        try {
          // Skip primary key indexes (already created)
          if (idx.is_unique && table.primary_keys.length > 0) {
            const pkCols = table.primary_keys.sort().join(',');
            const idxCols = idx.columns.sort().join(',');
            if (pkCols === idxCols) continue;
          }
          
          const indexName = this.quoteIdentifier(idx.name, targetDbType);
          const tableName = this.quoteIdentifier(table.name, targetDbType);
          const cols = idx.columns.map(c => this.quoteIdentifier(c, targetDbType)).join(', ');
          
          let sql: string;
          
          if (['postgresql', 'postgres'].includes(dbType)) {
            sql = `CREATE ${idx.is_unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${cols})`;
          } else if (['mysql', 'mariadb'].includes(dbType)) {
            sql = `CREATE ${idx.is_unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${cols})`;
          } else if (['mssql', 'sqlserver'].includes(dbType)) {
            sql = `CREATE ${idx.is_unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${cols})`;
          } else if (dbType === 'oracle') {
            sql = `CREATE ${idx.is_unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${cols})`;
          } else {
            continue;
          }
          
          console.log(`[Migration ${migrationId}] Creating index: ${sql}`);
          await targetClient.query(sql);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.warn(`[Migration ${migrationId}] Index creation failed for ${table.name}.${idx.name}:`, errorMessage);
        }
      }
    }
  }
}