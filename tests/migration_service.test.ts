import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { MigrationService } from "../src/services/data_engineering/migration_service";
import { ClientConnectionService } from "../src/services/data_engineering/client_connection_service";
import { EncryptionService } from "../src/services/data_engineering/encryption_service";

interface MigrationServiceTestApi {
  buildCreateTableSQL(table: unknown, dbType: string): string;
  mapDataType(sourceType: string, targetDbType: string): string;
  resolveColumnType(col: unknown, targetDbType: string): string;
  sanitizeDefaultValue(defaultValue: string | null, targetDbType: string): string | null;
  buildUpsertSQL(
    tableName: string,
    columns: string[],
    pkColumns: string[],
    placeholders: string,
    targetDbType: string,
    rowCount: number
  ): string;
  getBatchSize(columnCount: number, targetDbType: string): number;
  coerceValueForTarget(value: unknown, targetDbType: string): unknown;
  buildPaginatedQuery(
    tableName: string,
    targetDbType: string,
    limit: number,
    offset: number
  ): { query: string; params: (number | string)[] };
}

const service = new MigrationService(
  null as unknown as ClientConnectionService,
  null as unknown as EncryptionService
) as unknown as MigrationServiceTestApi;

const baseTable = {
  name: "orders",
  columns: [
    {
      name: "id",
      data_type: "integer",
      max_length: null,
      numeric_precision: 32,
      numeric_scale: 0,
      raw_type: null,
      nullable: false,
      default_value: null,
      is_primary_key: true,
      ordinal_position: 1,
    },
    {
      name: "name",
      data_type: "character varying",
      max_length: 255,
      numeric_precision: null,
      numeric_scale: null,
      raw_type: null,
      nullable: true,
      default_value: null,
      is_primary_key: false,
      ordinal_position: 2,
    },
    {
      name: "is_active",
      data_type: "boolean",
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      raw_type: null,
      nullable: false,
      default_value: null,
      is_primary_key: false,
      ordinal_position: 3,
    },
    {
      name: "payload",
      data_type: "jsonb",
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      raw_type: null,
      nullable: true,
      default_value: null,
      is_primary_key: false,
      ordinal_position: 4,
    },
  ],
  primary_keys: ["id"],
  foreign_keys: [],
  indexes: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MigrationService SQL Server target (PostgreSQL -> SQL Server)", () => {
  describe("buildCreateTableSQL", () => {
    it("wraps the CREATE TABLE in an existence check for SQL Server", () => {
      const sql = service.buildCreateTableSQL(baseTable, "mssql");
      expect(sql.startsWith("IF NOT EXISTS (SELECT 1 FROM sys.objects o JOIN sys.schemas s ON o.schema_id = s.schema_id WHERE o.type = 'U' AND s.name = SCHEMA_NAME() AND o.name = N'orders') CREATE TABLE [orders] (")).toBe(true);
      expect(sql).not.toContain("CREATE TABLE IF NOT EXISTS");
      expect(sql).toContain("[id] int NOT NULL");
      expect(sql).toContain("[name] nvarchar(255)");
      expect(sql).toContain("[is_active] bit NOT NULL");
      expect(sql).toContain("[payload] nvarchar(max)");
      expect(sql).toContain("PRIMARY KEY ([id])");
      expect(sql.endsWith(")")).toBe(true);
    });

    it("keeps PostgreSQL DDL unchanged", () => {
      const sql = service.buildCreateTableSQL(baseTable, "postgresql");
      expect(sql).toBe(
        'CREATE TABLE IF NOT EXISTS "orders" ("id" integer NOT NULL, "name" varchar(255), "is_active" boolean NOT NULL, "payload" jsonb, PRIMARY KEY ("id"))'
      );
    });

    it("keeps MySQL DDL unchanged", () => {
      const sql = service.buildCreateTableSQL(baseTable, "mysql");
      expect(sql).toBe(
        "CREATE TABLE IF NOT EXISTS `orders` (`id` int NOT NULL, `name` varchar(255), `is_active` tinyint(1) NOT NULL, `payload` json, PRIMARY KEY (`id`))"
      );
    });
  });

  describe("mapDataType / resolveColumnType", () => {
    it("maps native PostgreSQL types to safe SQL Server types", () => {
      expect(service.mapDataType("bytea", "mssql")).toBe("varbinary(max)");
      expect(service.mapDataType("interval", "mssql")).toBe("nvarchar(max)");
      expect(service.mapDataType("inet", "mssql")).toBe("nvarchar(45)");
      expect(service.mapDataType("cidr", "mssql")).toBe("nvarchar(45)");
      expect(service.mapDataType("macaddr", "mssql")).toBe("nvarchar(17)");
      expect(service.mapDataType("money", "mssql")).toBe("nvarchar(max)");
      expect(service.mapDataType("xml", "mssql")).toBe("nvarchar(max)");
      expect(service.mapDataType("uuid", "mssql")).toBe("uniqueidentifier");
      expect(service.mapDataType("jsonb", "mssql")).toBe("nvarchar(max)");
      expect(service.mapDataType("boolean", "mssql")).toBe("bit");
      expect(service.mapDataType("timestamp", "mssql")).toBe("datetime2");
    });

    it("keeps PostgreSQL type mapping unchanged", () => {
      expect(service.mapDataType("bytea", "postgresql")).toBe("bytea");
      expect(service.mapDataType("uuid", "postgresql")).toBe("uuid");
      expect(service.mapDataType("boolean", "postgresql")).toBe("boolean");
    });

    it("keeps MySQL type mapping unchanged", () => {
      expect(service.mapDataType("uuid", "mysql")).toBe("char(36)");
      expect(service.mapDataType("jsonb", "mysql")).toBe("json");
      expect(service.mapDataType("bytea", "mysql")).toBe("bytea");
    });

    it("resolves a bytea column to varbinary(max) on SQL Server targets", () => {
      const col = {
        name: "data",
        data_type: "bytea",
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        raw_type: null,
        nullable: true,
        default_value: null,
        is_primary_key: false,
        ordinal_position: 5,
      };
      expect(service.resolveColumnType(col, "mssql")).toBe("varbinary(max)");
    });
  });

  describe("sanitizeDefaultValue", () => {
    it("translates PostgreSQL default expressions to T-SQL for SQL Server", () => {
      expect(service.sanitizeDefaultValue("now()", "mssql")).toBe("GETDATE()");
      expect(service.sanitizeDefaultValue("CURRENT_DATE", "mssql")).toBe("CAST(GETDATE() AS DATE)");
      expect(service.sanitizeDefaultValue("CURRENT_TIME", "mssql")).toBe("CAST(GETDATE() AS TIME)");
      expect(service.sanitizeDefaultValue("LOCALTIMESTAMP", "mssql")).toBe("GETDATE()");
      expect(service.sanitizeDefaultValue("LOCALTIME", "mssql")).toBe("CAST(GETDATE() AS TIME)");
      expect(service.sanitizeDefaultValue("CURRENT_TIMESTAMP", "mssql")).toBe("CURRENT_TIMESTAMP");
    });

    it("skips PostgreSQL sequence defaults on SQL Server", () => {
      expect(service.sanitizeDefaultValue("nextval('orders_id_seq'::regclass)", "mssql")).toBeNull();
      expect(service.sanitizeDefaultValue("uuid_generate_v4()", "mssql")).toBeNull();
    });

    it("keeps PostgreSQL default handling unchanged for PostgreSQL targets", () => {
      expect(service.sanitizeDefaultValue("now()", "postgresql")).toBe("now()");
      expect(service.sanitizeDefaultValue("CURRENT_TIMESTAMP", "postgresql")).toBe("CURRENT_TIMESTAMP");
    });
  });

  describe("buildUpsertSQL", () => {
    it("terminates the SQL Server MERGE with a semicolon", () => {
      const sql = service.buildUpsertSQL("orders", ["[id]", "[name]"], ["[id]"], "(@p1, @p2)", "mssql", 1);
      expect(sql.endsWith(";")).toBe(true);
      expect(sql.endsWith(");")).toBe(true);
      expect(sql).toContain("MERGE INTO [orders] AS TARGET");
      expect(sql).toContain("USING (VALUES (@p1, @p2)) AS SOURCE ([id], [name])");
      expect(sql).toContain("ON TARGET.[id] = SOURCE.[id]");
    });

    it("uses plain INSERT for SQL Server tables without a primary key", () => {
      const sql = service.buildUpsertSQL("orders", ["[id]", "[name]"], [], "(@p1, @p2)", "mssql", 1);
      expect(sql).toBe("INSERT INTO [orders] ([id], [name]) VALUES (@p1, @p2)");
    });

    it("keeps PostgreSQL upsert SQL unchanged", () => {
      const sql = service.buildUpsertSQL("orders", ['"id"', '"name"'], ['"id"'], '($1, $2)', "postgresql", 1);
      expect(sql).toBe('INSERT INTO "orders" ("id", "name") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING');
    });

    it("keeps MySQL upsert SQL unchanged", () => {
      const sql = service.buildUpsertSQL("orders", ["`id`", "`name`"], ["`id`"], "(?, ?)", "mysql", 1);
      expect(sql).toBe("INSERT IGNORE INTO `orders` (`id`, `name`) VALUES (?, ?)");
    });
  });

  describe("getBatchSize", () => {
    it("respects the SQL Server 2100-parameter limit", () => {
      expect(service.getBatchSize(1, "mssql")).toBe(1000);
      expect(service.getBatchSize(3, "mssql")).toBe(700);
      expect(service.getBatchSize(50, "mssql")).toBe(42);
      expect(service.getBatchSize(5000, "mssql")).toBe(1);
      expect(service.getBatchSize(0, "mssql")).toBe(1000);
    });

    it("keeps the default batch size for other targets", () => {
      expect(service.getBatchSize(50, "postgresql")).toBe(1000);
      expect(service.getBatchSize(50, "mysql")).toBe(1000);
    });
  });

  describe("coerceValueForTarget", () => {
    it("serializes objects and arrays to JSON for SQL Server", () => {
      expect(service.coerceValueForTarget({ a: 1 }, "mssql")).toBe('{"a":1}');
      expect(service.coerceValueForTarget([1, 2], "mssql")).toBe("[1,2]");
    });

    it("leaves null, strings, buffers and dates untouched for SQL Server", () => {
      expect(service.coerceValueForTarget(null, "mssql")).toBeNull();
      expect(service.coerceValueForTarget(undefined, "mssql")).toBeUndefined();
      expect(service.coerceValueForTarget("plain", "mssql")).toBe("plain");
      expect(service.coerceValueForTarget(42, "mssql")).toBe(42);
      const buf = Buffer.from("abc");
      expect(service.coerceValueForTarget(buf, "mssql")).toBe(buf);
      const date = new Date(0);
      expect(service.coerceValueForTarget(date, "mssql")).toBe(date);
    });

    it("keeps values untouched for non-SQL Server targets", () => {
      const obj = { a: 1 };
      const arr = [1, 2];
      expect(service.coerceValueForTarget(obj, "postgresql")).toBe(obj);
      expect(service.coerceValueForTarget(arr, "postgresql")).toBe(arr);
      expect(service.coerceValueForTarget(obj, "mysql")).toBe(obj);
    });
  });

  describe("buildPaginatedQuery", () => {
    it("keeps PostgreSQL pagination unchanged", () => {
      const result = service.buildPaginatedQuery("orders", "postgresql", 1000, 0);
      expect(result.query).toBe('SELECT * FROM "orders" ORDER BY 1 LIMIT $1 OFFSET $2');
      expect(result.params).toEqual([1000, 0]);
    });
  });
});