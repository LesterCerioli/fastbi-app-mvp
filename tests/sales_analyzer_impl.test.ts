import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("../src/services/ai/vectorizer");
jest.mock("../src/services/ai/ml_model");
import { query } from "../src/services/db";
import { EnhancedTFIDFVectorizer } from "../src/services/ai/vectorizer";
import { LinearRegressionModel } from "../src/services/ai/ml_model";
import { SalesAnalyzerImpl } from "../src/services/ai/sales_analyzer_impl";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockVectorizer = EnhancedTFIDFVectorizer as jest.MockedClass<typeof EnhancedTFIDFVectorizer>;
const mockModel = LinearRegressionModel as jest.MockedClass<typeof LinearRegressionModel>;

describe("SalesAnalyzerImpl - positive scenarios", () => {
  it("answers a question with sum aggregation", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ coalesce: "5000" }] } as any);
    const svc = new SalesAnalyzerImpl();
    const answer = await svc.askQuestion("acme", "total de vendas?");
    expect(answer).toContain("R$");
  });

  it("predicts sales trend", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        { month: new Date("2025-01-01"), total_sales: "1000" },
        { month: new Date("2025-02-01"), total_sales: "1200" },
        { month: new Date("2025-03-01"), total_sales: "1400" },
        { month: new Date("2025-04-01"), total_sales: "1600" },
      ],
    } as any);
    const svc = new SalesAnalyzerImpl();
    const result = await svc.predictSalesTrend("acme", 2);
    expect(result.historicalTrend.length).toBeGreaterThanOrEqual(4);
  });

  it("generates sales insights", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ total_revenue: "50000", total_transactions: "100", avg_order_value: "500" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ last3: "30000", prev3: "20000" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const svc = new SalesAnalyzerImpl();
    const insights = await svc.generateSalesInsights("acme");
    expect(insights.totalRevenue).toBe(50000);
  });

  it("discovers tables", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { table_name: "sales_records", row_count: "100", columns: ["id", "amount"] },
        { table_name: "analysis_history", row_count: "50", columns: ["id", "query"] },
      ],
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ column_name: "id", data_type: "uuid", is_nullable: "NO" }, { column_name: "amount", data_type: "numeric", is_nullable: "YES" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ column_name: "id", data_type: "uuid", is_nullable: "NO" }, { column_name: "query", data_type: "text", is_nullable: "YES" }] } as any);
    const svc = new SalesAnalyzerImpl();
    const tables = await svc.discoverTables("acme");
    expect(tables.length).toBe(2);
  });
});

describe("SalesAnalyzerImpl - negative scenarios", () => {
  it("throws when organization_name is empty for askQuestion", async () => {
    const svc = new SalesAnalyzerImpl();
    await expect(svc.askQuestion("", "question")).rejects.toThrow("organization_name is required");
  });

  it("throws when question is empty", async () => {
    const svc = new SalesAnalyzerImpl();
    await expect(svc.askQuestion("acme", "")).rejects.toThrow("question is required");
  });

  it("throws when organization not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const svc = new SalesAnalyzerImpl();
    await expect(svc.askQuestion("unknown", "total?")).rejects.toThrow("organization not found");
  });

  it("throws when insufficient data for prediction", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ month: new Date("2025-01-01"), total_sales: "1000" }] } as any);
    const svc = new SalesAnalyzerImpl();
    await expect(svc.predictSalesTrend("acme", 1)).rejects.toThrow("insufficient data");
  });
});
