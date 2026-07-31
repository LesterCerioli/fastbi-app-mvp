import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { ContextRetriever } from "../src/services/reports/report_narrative/context_retriever";
import { query } from "../src/services/db";

const retriever = new ContextRetriever();

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ContextRetriever", () => {
  it("retrieve with revenue section loads sales metrics", async () => {
    mockQuery([{ source_ref: "doc1", content: "Revenue data" }]);
    mockQuery([{ total: 1000, count: 50, avg: 20 }]);
    mockQuery([{ prev: 800 }]);
    mockQuery([{ category: "Electronics", rev: 500 }]);
    const result = await retriever.retrieve("org-1", "revenue", "revenue", 5, 30);
    expect(result.numericData["sales_records:total_revenue"]).toBe(1000);
    expect(result.period).toBe("last_30_days");
  });

  it("retrieve with kpi section loads KPI metrics", async () => {
    mockQuery([]);
    mockQuery([{ code: "REV", actual_value: 100, target_value: 120, variance_percentage: -16.67 }]);
    const result = await retriever.retrieve("org-1", "kpi", "kpi", 5, 30);
    expect(result.numericData["kpis:REV:actual_value"]).toBe(100);
    expect(result.numericData["kpis:REV:variance_pct"]).toBe(-16.67);
  });

  it("retrieve with anomaly section loads anomaly metrics", async () => {
    mockQuery([]);
    mockQuery([{ metric_name: "revenue_drop", expected_value: 500, actual_value: 100, deviation_zscore: 3.5 }]);
    const result = await retriever.retrieve("org-1", "anomaly", "anomaly", 5, 30);
    expect(result.numericData["agent_anomalies:revenue_drop:expected"]).toBe(500);
  });

  it("fetchKBDocuments returns scored documents", async () => {
    mockQuery([
      { source_ref: "doc1", content: "company revenue grew" },
      { source_ref: "doc2", content: "cost reduction strategy" },
    ]);
    const result = await retriever.fetchKBDocuments("org-1", "revenue", 1);
    expect(result).toHaveLength(1);
    expect(result[0].sourceRef).toBe("doc1");
  });

  it("retrieve defaults topK and lookbackDays when <= 0", async () => {
    mockQuery([]);
    mockQuery([{ total: 0, count: 0, avg: 0 }]);
    mockQuery([{ prev: 0 }]);
    mockQuery([]);
    mockQuery([]);
    const result = await retriever.retrieve("org-1", "", "", -1, -1);
    expect(result.period).toBe("last_30_days");
  });

  it("fetchKBDocuments returns empty for no rows", async () => {
    mockQuery([]);
    const result = await retriever.fetchKBDocuments("org-1", "anything", 10);
    expect(result).toEqual([]);
  });

  it("loadSalesMetrics handles zero previous period", async () => {
    mockQuery([{ total: 100, count: 10, avg: 10 }]);
    mockQuery([{ prev: 0 }]);
    mockQuery([]);
    const out: Record<string, number> = {};
    await retriever.loadSalesMetrics("org-1", 30, out);
    expect(out["sales_records:growth_pct"]).toBeUndefined();
  });

  it("loadKPIMetrics ignores rows where target_value is null", async () => {
    mockQuery([{ code: "REV", actual_value: 100, target_value: null, variance_percentage: null }]);
    const out: Record<string, number> = {};
    await retriever.loadKPIMetrics("org-1", out);
    expect(out["kpis:REV:actual_value"]).toBe(100);
    expect(out["kpis:REV:target_value"]).toBeUndefined();
  });
});
