import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
import { query } from "../src/services/db";
import { SalesGrowthService } from "../src/services/sales/sales_growth_service";

const mockQuery = query as jest.MockedFunction<typeof query>;
const svc = new SalesGrowthService();

describe("SalesGrowthService - positive scenarios", () => {
  it("creates a sales record", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: "rec-1", organization_id: "org-1", amount: "100", date: new Date(),
        category: "Electronics", product_id: null, region: null, channel: null,
        customer_segment: null, quantity: null, metadata: null,
        created_at: new Date(), updated_at: new Date(),
      }],
    } as any);
    const rec = await svc.createSalesRecord({ organizationName: "acme", amount: 100, date: new Date() });
    expect(rec.id).toBe("rec-1");
    expect(rec.amount).toBe(100);
  });

  it("returns growth data", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        { period: "2025-01", total_revenue: "1000", transaction_count: 10, average_transaction: "100", segments_count: 2 },
        { period: "2025-02", total_revenue: "1200", transaction_count: 12, average_transaction: "100", segments_count: 2 },
      ],
    } as any);
    const data = await svc.getGrowthData("acme", new Date("2025-01-01"), new Date("2025-02-28"), "month", undefined, undefined, undefined, true);
    expect(data.labels.length).toBe(2);
  });

  it("returns top performers", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ name: "Electronics", total_revenue: "5000", transaction_count: 20, average_transaction: "250", total_quantity: "100" }],
    } as any);
    const top = await svc.getTopPerformers("acme", new Date("2025-01-01"), new Date("2025-12-31"), "category");
    expect(top.length).toBe(1);
    expect(top[0].name).toBe("Electronics");
  });

  it("returns monthly growth data", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        { month: "Jan", month_num: 1, revenue: "1000", transaction_count: 10, average_transaction: "100" },
        { month: "Feb", month_num: 2, revenue: "1200", transaction_count: 12, average_transaction: "100" },
      ],
    } as any);
    const result = await svc.getMonthlyGrowthData("acme", 2025);
    expect(result.data.length).toBe(2);
    expect(result.summary.total_revenue).toBe(2200);
  });
});

describe("SalesGrowthService - negative scenarios", () => {
  it("throws when organization not found for createSalesRecord", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.createSalesRecord({ organizationName: "unknown", amount: 100, date: new Date() })).rejects.toThrow("not found");
  });

  it("throws for invalid dimension in getTopPerformers", async () => {
    await expect(svc.getTopPerformers("acme", new Date(), new Date(), "invalid_dim")).rejects.toThrow("invalid dimension");
  });

  it("throws when organization not found for getGrowthData", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.getGrowthData("unknown", new Date(), new Date())).rejects.toThrow("not found");
  });

  it("returns 0 deleted rows for empty date range", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rowCount: 0 } as any);
    const count = await svc.deleteSalesRecords("acme", new Date("2020-01-01"), new Date("2020-01-02"));
    expect(count).toBe(0);
  });
});
