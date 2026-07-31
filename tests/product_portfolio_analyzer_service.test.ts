import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { ProductPortfolioAnalyzerService } from "../src/services/products/product_portfolio_analyzer_service";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("ProductPortfolioAnalyzerService", () => {
  let service: ProductPortfolioAnalyzerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductPortfolioAnalyzerService();
  });

  it("getBCGMatrix returns matrix with classified products", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { pname: "Product A", sku: "A1", category: "Cat1", revenue: 50000, growth_pct: 20, share_pct: 15 },
        { pname: "Product B", sku: "B1", category: "Cat1", revenue: 10000, growth_pct: 5, share_pct: 5 },
      ],
    } as any);

    const result = await service.getBCGMatrix("Acme Corp");

    expect(result.stars).toBeDefined();
    expect(result.cashCows).toBeDefined();
    expect(result.questionMarks).toBeDefined();
    expect(result.dogs).toBeDefined();
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it("compareMarginVsTarget returns deviation results with counts", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { sku: "A1", name: "Product A", product_category: "Cat1", actual_margin: 25, target_margin: 20, revenue: 50000 },
      ],
    } as any);

    const result = await service.compareMarginVsTarget("Acme Corp");

    expect(result.products).toHaveLength(1);
    expect(result.products[0].deviationPct).toBe(5);
  });

  it("getLifecycleDistribution returns stages with revenue percentages", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { stage: "growth", product_count: 5, revenue: 50000, avg_margin: 20 },
        { stage: "mature", product_count: 3, revenue: 30000, avg_margin: 15 },
      ],
    } as any);

    const result = await service.getLifecycleDistribution("Acme Corp");

    expect(result.stages).toHaveLength(2);
    expect(result.totalRevenue).toBe(80000);
    expect(result.stages[0].revenuePct).toBeGreaterThan(0);
  });

  it("identifyUnderperformingProducts returns underperforming products", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { sku: "C1", name: "Product C", product_category: "Cat2", lifecycle_stage: "decline", revenue: 500, margin_pct: 5 },
      ],
    } as any);

    const result = await service.identifyUnderperformingProducts("Acme Corp");

    expect(result.products).toHaveLength(1);
    expect(result.products[0].reason).toBe("both");
  });

  it("getBCGMatrix throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.getBCGMatrix("Unknown")).rejects.toThrow("organization not found");
  });

  it("compareMarginVsTarget throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.compareMarginVsTarget("Unknown")).rejects.toThrow("organization not found");
  });

  it("getLifecycleDistribution throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.getLifecycleDistribution("Unknown")).rejects.toThrow("organization not found");
  });

  it("identifyUnderperformingProducts throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(
      service.identifyUnderperformingProducts("Unknown"),
    ).rejects.toThrow("organization not found");
  });
});
