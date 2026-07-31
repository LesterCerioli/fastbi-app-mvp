import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
import { query } from "../src/services/db";
import { SalesAnalyticsService } from "../src/services/sales/sales_analytics_service";

const mockQuery = query as jest.MockedFunction<typeof query>;
const svc = new SalesAnalyticsService();

describe("SalesAnalyticsService - positive scenarios", () => {
  it("returns revenue insights", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1", name: "acme" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{
        total_revenue: "1000", total_quantity: "10", avg_transaction_value: "100",
        total_transactions: "10", first_sale_date: new Date(), last_sale_date: new Date(),
      }],
    } as any);
    const result = await svc.getRevenueInsights("acme");
    expect(result.key_metrics.total_revenue).toBe(1000);
  });

  it("returns forecast", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        { month: new Date("2025-01-01"), revenue: "1000", month_number: 1 },
        { month: new Date("2025-02-01"), revenue: "1200", month_number: 2 },
      ],
    } as any);
    const result = await svc.forecastRevenue("acme", 3);
    expect(result.forecast.length).toBe(3);
  });

  it("returns expansion opportunities", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{
        region: "US", total_revenue: "5000", categories_sold: 3,
        transaction_count: 50, avg_transaction_value: "100",
        top_category: "Electronics", top_category_revenue: "3000",
        expansion_potential: "High Growth Potential",
      }],
    } as any);
    const opps = await svc.getExpansionOpportunities("acme", 1000);
    expect(opps.length).toBe(1);
    expect(opps[0].region).toBe("US");
  });

  it("optimizes product mix", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ category: "Electronics", total_revenue: "20000", total_quantity: "50", transaction_count: 10, avg_transaction_value: "2000", regions_present: 3 }],
    } as any);
    const result = await svc.optimizeProductMix("acme");
    expect(result.summary.total_categories_analyzed).toBe(1);
  });
});

describe("SalesAnalyticsService - negative scenarios", () => {
  it("throws when organization not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.getRevenueInsights("unknown")).rejects.toThrow("not found");
  });

  it("throws when organization name is resolved but has no data", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.forecastRevenue("unknown", 1)).rejects.toThrow("not found");
  });

  it("returns error when historical data is empty", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const result = await svc.forecastRevenue("acme", 1);
    expect(result.error).toBeDefined();
  });

  it("throws access denied for wrong organization", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-2" }] } as any);
    await expect(svc.getExpansionOpportunities("acme", 1000, "other")).rejects.toThrow("access denied");
  });
});
