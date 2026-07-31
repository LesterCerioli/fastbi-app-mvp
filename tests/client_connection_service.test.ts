import { jest } from "@jest/globals";

const mockPoolConnect = jest.fn();
const mockQueryOnClient = jest.fn();
const mockRelease = jest.fn();
const mockEnd = jest.fn();

jest.mock("pg", () => {
  class MockPool {
    connect = mockPoolConnect;
    end = mockEnd;
    constructor(_opts: any) {}
  }
  return { Pool: MockPool };
});

jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { ClientConnectionService } from "../src/services/data_engineering/client_connection_service";
import { EncryptionService } from "../src/services/data_engineering/encryption_service";
import { query } from "../src/services/db";

const mockEncryption = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
} as unknown as jest.Mocked<EncryptionService>;

const service = new ClientConnectionService(mockEncryption);

beforeEach(() => {
  jest.clearAllMocks();
  mockPoolConnect.mockReset();
  mockEnd.mockReset();
});

describe("ClientConnectionService", () => {
  it("registerOrganizationConnection inserts and returns connection", async () => {
    jest.mocked(query)
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: "conn-1", organization_id: "org-1", connection_name: "myconn", host: "localhost", port: 5432, database_name: "db1", created_at: new Date(), is_active: true }] } as any)
      .mockResolvedValueOnce({ rows: [{ name: "Acme" }] } as any);
    mockEncryption.encrypt.mockReturnValue("encrypted-pwd");
    const result = await service.registerOrganizationConnection("Acme", "myconn", "localhost", 5432, "db1", "user", "pwd", "postgresql", "require", 5000, 60);
    expect(result.connection_name).toBe("myconn");
  });

  it("getConnectionConfig returns decrypted config", async () => {
    jest.mocked(query)
      .mockResolvedValueOnce({ rows: [{ id: "conn-1", organization_id: "org-1", connection_name: "myconn", db_type: "postgresql", host: "localhost", port: 5432, database_name: "db1", username: "user", password_encrypted: "enc", ssl_mode: "require", max_rows_limit: 10000, query_timeout_seconds: 30, is_active: true, created_at: new Date() }] } as any)
      .mockResolvedValueOnce({ rows: [{ name: "Acme" }] } as any);
    mockEncryption.decrypt.mockReturnValue("decrypted-pwd");
    const result = await service.getConnectionConfig("conn-1");
    expect(result).not.toBeNull();
    expect((result as any).password).toBe("decrypted-pwd");
  });

  it("executeQuery returns success with data", async () => {
    mockPoolConnect.mockResolvedValue({ query: mockQueryOnClient, release: mockRelease });
    mockEnd.mockResolvedValue(undefined);
    const mockField = { name: "col1" };
    mockQueryOnClient.mockResolvedValue({ rows: [{ col1: 1 }], fields: [mockField] });
    jest.mocked(query)
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ organization_id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: "conn-1", organization_id: "org-1", connection_name: "myconn", db_type: "postgresql", host: "localhost", port: 5432, database_name: "db1", username: "user", password_encrypted: "enc", ssl_mode: "require", max_rows_limit: 10000, query_timeout_seconds: 30, is_active: true, created_at: new Date() }] } as any)
      .mockResolvedValueOnce({ rows: [{ name: "Acme" }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: "conn-1", organization_id: "org-1", connection_name: "myconn", db_type: "postgresql", host: "localhost", port: 5432, database_name: "db1", username: "user", password_encrypted: "enc", ssl_mode: "require", max_rows_limit: 10000, query_timeout_seconds: 30, is_active: true, created_at: new Date() }] } as any)
      .mockResolvedValueOnce({ rows: [{ name: "Acme" }] } as any);

    const result = await service.executeQuery("Acme", "conn-1", "SELECT 1");
    expect(result.success).toBe(true);
  });

  it("testConnection returns success when pool connects", async () => {
    mockPoolConnect.mockResolvedValue({ release: mockRelease });
    mockEnd.mockResolvedValue(undefined);
    jest.mocked(query)
      .mockResolvedValueOnce({ rows: [{ id: "conn-1", organization_id: "org-1", connection_name: "myconn", db_type: "postgresql", host: "localhost", port: 5432, database_name: "db1", username: "user", password_encrypted: "enc", ssl_mode: "require", max_rows_limit: 10000, query_timeout_seconds: 30, is_active: true, created_at: new Date() }] } as any)
      .mockResolvedValueOnce({ rows: [{ name: "Acme" }] } as any);
    const result = await service.testConnection("conn-1");
    expect(result.success).toBe(true);
  });

  it("registerOrganizationConnection throws for unknown org", async () => {
    jest.mocked(query).mockResolvedValueOnce({ rows: [] } as any);
    await expect(service.registerOrganizationConnection("Ghost", "c", "h", 1, "d", "u", "p", "pg", "req", 1, 1)).rejects.toThrow("organization 'Ghost' not found");
  });

  it("getConnectionConfig returns null for inactive connection", async () => {
    jest.mocked(query).mockResolvedValueOnce({ rows: [] } as any);
    const result = await service.getConnectionConfig("missing");
    expect(result).toBeNull();
  });

  it("executeQuery blocks DDL commands", async () => {
    jest.mocked(query)
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ organization_id: "org-1" }] } as any);
    const result = await service.executeQuery("Acme", "conn-1", "DROP TABLE users");
    expect(result.success).toBe(false);
  });

  it("deleteConnection returns false when no rows affected", async () => {
    jest.mocked(query).mockResolvedValueOnce({ rows: [] } as any);
    const result = await service.deleteConnection("missing");
    expect(result).toBe(false);
  });
});
