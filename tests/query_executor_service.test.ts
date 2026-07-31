import { jest } from "@jest/globals";

import crypto from "crypto";
import { ClientConnectionService } from "../src/services/data_engineering/client_connection_service";
import { QueryExecutorService } from "../src/services/data_engineering/query_executor_service";

jest.mock("crypto", () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash"),
  }),
}));

const mockExecuteQuery = jest.fn();

jest.mock("../src/services/data_engineering/client_connection_service", () => {
  return {
    ClientConnectionService: jest.fn().mockImplementation(() => ({
      executeQuery: mockExecuteQuery,
    })),
  };
});

describe("QueryExecutorService", () => {
  let service: QueryExecutorService;
  let clientConnection: ClientConnectionService;

  beforeEach(() => {
    jest.clearAllMocks();
    clientConnection = new ClientConnectionService();
    service = new QueryExecutorService(clientConnection);
  });

  it("execute returns result from connection service", async () => {
    mockExecuteQuery.mockResolvedValue({ success: true, data: [{ id: 1 }] });

    const result = await service.execute("Acme Corp", "conn-1", "SELECT 1");

    expect(result.success).toBe(true);
    expect(result.from_cache).toBe(false);
    expect(result.execution_time_ms).toBeGreaterThanOrEqual(0);
  });

  it("execute returns cached result when useCache is true and cache is fresh", async () => {
    mockExecuteQuery.mockResolvedValue({ success: true, data: [{ id: 1 }] });

    await service.execute("Acme Corp", "conn-1", "SELECT 1", [], true, 300);
    const cached = await service.execute("Acme Corp", "conn-1", "SELECT 1", [], true, 300);

    expect(cached.from_cache).toBe(true);
  });

  it("executeBatch executes multiple queries and returns results", async () => {
    mockExecuteQuery.mockResolvedValue({ success: true, data: [] });

    const results = await service.executeBatch("Acme Corp", [
      { connection_id: "conn-1", query: "SELECT 1" },
      { connection_id: "conn-1", query: "SELECT 2" },
    ]);

    expect(results).toHaveLength(2);
    expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
  });

  it("getTableSchema returns column info on success", async () => {
    mockExecuteQuery.mockResolvedValue({
      success: true,
      data: [{ column_name: "id", data_type: "integer" }],
      row_count: 1,
    });

    const result = await service.getTableSchema("Acme Corp", "conn-1", "users");

    expect(result.success).toBe(true);
    expect(result.table_name).toBe("users");
  });

  it("execute throws when connection fails", async () => {
    mockExecuteQuery.mockRejectedValue(new Error("connection error"));

    await expect(
      service.execute("Acme Corp", "conn-bad", "SELECT 1"),
    ).rejects.toThrow("connection error");
  });

  it("getTableSchema returns error object when query fails", async () => {
    mockExecuteQuery.mockResolvedValue({ success: false, error: "permission denied" });

    const result = await service.getTableSchema("Acme Corp", "conn-1", "users");

    expect(result.success).toBe(false);
    expect(result.error).toBe("permission denied");
  });

  it("listTables returns error object when query fails", async () => {
    mockExecuteQuery.mockResolvedValue({ success: false, error: "no access" });

    const result = await service.listTables("Acme Corp", "conn-1");

    expect(result.success).toBe(false);
  });

  it("validateQuery returns error object when query is invalid", async () => {
    mockExecuteQuery.mockResolvedValue({ success: false, error: "syntax error" });

    const result = await service.validateQuery("Acme Corp", "conn-1", "SELECT INVALID");

    expect(result.is_valid).toBe(false);
  });
});
