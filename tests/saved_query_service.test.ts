import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
import { query } from "../src/services/db";
import { SavedQueryService } from "../src/services/data_engineering/saved_query_service";

const mockQuery = query as jest.MockedFunction<typeof query>;
const svc = new SavedQueryService();

describe("SavedQueryService - positive scenarios", () => {
  it("saves a query successfully", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "q-1", name: "My Query", query_text: "SELECT 1", created_at: new Date() }],
    } as any);
    const result = await svc.saveQuery("acme", "conn-1", "My Query", "SELECT 1");
    expect(result.success).toBe(true);
    expect(result.id).toBe("q-1");
  });

  it("gets saved queries", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: "q-1", name: "My Query", query_text: "SELECT 1",
        connection_name: "conn-1", execution_count: 5,
      }],
    } as any);
    const result = await svc.getSavedQueries("acme");
    expect(result.success).toBe(true);
    expect((result.queries as any[]).length).toBe(1);
  });

  it("updates a saved query", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "q-1" }] } as any);
    const result = await svc.updateSavedQuery("q-1", "New Name");
    expect(result.success).toBe(true);
  });

  it("deletes a saved query", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "q-1" }] } as any);
    const result = await svc.deleteSavedQuery("q-1");
    expect(result.success).toBe(true);
  });
});

describe("SavedQueryService - negative scenarios", () => {
  it("returns error when organization not found on save", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const result = await svc.saveQuery("unknown", "conn-1", "Query", "SELECT 1");
    expect(result.success).toBe(false);
  });

  it("returns empty when organization not found on getSavedQueries", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const result = await svc.getSavedQueries("unknown");
    expect(result.success).toBe(false);
  });

  it("returns error when no fields to update", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    const result = await svc.updateSavedQuery("q-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("No fields to update");
  });

  it("throws when organization not found for resolveQueryIDByName", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.resolveQueryIDByName("unknown", "conn", "query")).rejects.toThrow("organization not found");
  });
});
