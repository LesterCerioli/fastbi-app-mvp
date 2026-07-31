import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { ReportingRAGEngine } from "../src/services/reports/report_knowledge_base/reporting_rag_engine";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("ReportingRAGEngine", () => {
  let engine: ReportingRAGEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new ReportingRAGEngine();
  });

  it("resolveOrganizationID returns id when org exists", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

    const result = await engine.resolveOrganizationID("Acme Corp");

    expect(result).toBe("org-1");
  });

  it("retrieveReportContext returns scored documents sorted by score", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { source_type: "kpi", source_ref: "rev", content: "revenue growth analysis" },
          { source_type: "insight", source_ref: "ins-1", content: "cost reduction insight" },
        ],
      } as any);

    const result = await engine.retrieveReportContext("Acme Corp", "revenue", 5);

    expect(result.length).toBe(2);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  it("listIndexedSources returns list of indexed sources", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { source_type: "kpi", source_ref: "rev", version: 2, last_indexed_at: new Date() },
        ],
      } as any);

    const result = await engine.listIndexedSources("Acme Corp");

    expect(result).toHaveLength(1);
    expect(result[0].sourceRef).toBe("rev");
  });

  it("upsertDocument inserts or updates a document", async () => {
    mockQuery.mockResolvedValueOnce({} as any);

    await expect(
      engine.upsertDocument("org-1", "kpi", "rev", "content"),
    ).resolves.toBeUndefined();
  });

  it("resolveOrganizationID throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(engine.resolveOrganizationID("Unknown")).rejects.toThrow("organization not found");
  });

  it("resolveOrganizationID throws when name is empty", async () => {
    await expect(engine.resolveOrganizationID("")).rejects.toThrow("organization_name is required");
  });

  it("retrieveReportContext throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(engine.retrieveReportContext("Unknown", "type", 5)).rejects.toThrow("organization not found");
  });

  it("retrieveReportContext returns empty array when no docs exist", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const result = await engine.retrieveReportContext("Acme Corp", "type", 5);

    expect(result).toEqual([]);
  });
});
