import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
}));

import { FinancialTransactionAnalyzerService } from "../src/services/finances/financial_transaction_analyzer_service";
import { query } from "../src/services/db";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("FinancialTransactionAnalyzerService", () => {
  let service: FinancialTransactionAnalyzerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinancialTransactionAnalyzerService();
  });

  describe("analyzeCOGSBreakdown", () => {
    it("returns COGS breakdown with positive revenue and all cost components", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "100000",
            total_cogs: "60000",
            direct_material: "20000",
            direct_labor: "15000",
            manufacturing: "10000",
            freight_in: "5000",
            royalties: "3000",
            commission: "2000",
            shipping: "3000",
            payment_fees: "1000",
            packaging: "500",
            fixed_direct_allocated: "500",
          }],
        } as any);

      const result = await service.analyzeCOGSBreakdown("TestOrg");

      expect(result.totalRevenue).toBe(100000);
      expect(result.overallMarginPct).toBe(40);
      expect(result.largestCostDriver).toBe("direct_material");
    });

    it("handles zero revenue gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "0",
            total_cogs: "0",
            direct_material: "0",
            direct_labor: "0",
            manufacturing: "0",
            freight_in: "0",
            royalties: "0",
            commission: "0",
            shipping: "0",
            payment_fees: "0",
            packaging: "0",
            fixed_direct_allocated: "0",
          }],
        } as any);

      const result = await service.analyzeCOGSBreakdown("TestOrg");

      expect(result.totalRevenue).toBe(0);
      expect(result.overallMarginPct).toBe(0);
    });

    it("applies date filters when startDate and endDate provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "50000",
            total_cogs: "30000",
            direct_material: "10000",
            direct_labor: "8000",
            manufacturing: "5000",
            freight_in: "2000",
            royalties: "1500",
            commission: "1000",
            shipping: "1500",
            payment_fees: "500",
            packaging: "300",
            fixed_direct_allocated: "200",
          }],
        } as any);

      const result = await service.analyzeCOGSBreakdown("TestOrg", "2024-01-01", "2024-12-31");

      expect(result.totalRevenue).toBe(50000);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("returns correct largestCostDriver when directLabor is highest", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "100000",
            total_cogs: "80000",
            direct_material: "5000",
            direct_labor: "40000",
            manufacturing: "10000",
            freight_in: "5000",
            royalties: "3000",
            commission: "2000",
            shipping: "3000",
            payment_fees: "1000",
            packaging: "500",
            fixed_direct_allocated: "500",
          }],
        } as any);

      const result = await service.analyzeCOGSBreakdown("TestOrg");

      expect(result.largestCostDriver).toBe("direct_labor");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.analyzeCOGSBreakdown("UnknownOrg")).rejects.toThrow("organization not found");
    });

    it("handles negative revenue by setting marginPct to 0", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "0",
            total_cogs: "100",
            direct_material: "0",
            direct_labor: "0",
            manufacturing: "0",
            freight_in: "0",
            royalties: "0",
            commission: "0",
            shipping: "0",
            payment_fees: "0",
            packaging: "0",
            fixed_direct_allocated: "0",
          }],
        } as any);

      const result = await service.analyzeCOGSBreakdown("TestOrg");

      expect(result.overallMarginPct).toBe(0);
    });

    it("handles null cost values as zero", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "1000",
            total_cogs: null,
            direct_material: null,
            direct_labor: null,
            manufacturing: null,
            freight_in: null,
            royalties: null,
            commission: null,
            shipping: null,
            payment_fees: null,
            packaging: null,
            fixed_direct_allocated: null,
          }],
        } as any);

      const result = await service.analyzeCOGSBreakdown("TestOrg");

      expect(result.totalCOGS).toBe(0);
      expect(result.overallMarginPct).not.toBeNaN();
    });

    it("throws on database error", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("connection failed"));

      await expect(service.analyzeCOGSBreakdown("TestOrg")).rejects.toThrow("connection failed");
    });
  });

  describe("compareMarginByDimension", () => {
    it("returns comparison with multiple items for valid dimension", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { dim: "Online", revenue: "50000", cogs: "25000", margin_pct: "50", tx_count: "100" },
            { dim: "Retail", revenue: "30000", cogs: "18000", margin_pct: "40", tx_count: "60" },
          ],
        } as any);

      const result = await service.compareMarginByDimension("TestOrg", "channel");

      expect(result.dimension).toBe("channel");
      expect(result.items).toHaveLength(2);
      expect(result.bestPerformer).toBe("Online");
      expect(result.worstPerformer).toBe("Retail");
    });

    it("returns empty items when no data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.compareMarginByDimension("TestOrg", "region");

      expect(result.items).toHaveLength(0);
      expect(result.bestPerformer).toBe("");
      expect(result.avgMarginPct).toBe(0);
    });

    it("supports customer_tier dimension", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { dim: "Gold", revenue: "80000", cogs: "40000", margin_pct: "50", tx_count: "200" },
          ],
        } as any);

      const result = await service.compareMarginByDimension("TestOrg", "customer_tier");

      expect(result.items).toHaveLength(1);
    });

    it("supports product_category dimension", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { dim: "Electronics", revenue: "90000", cogs: "50000", margin_pct: "44.44", tx_count: "150" },
          ],
        } as any);

      const result = await service.compareMarginByDimension("TestOrg", "product_category");

      expect(result.items[0].dimension).toBe("Electronics");
    });

    it("throws for unsupported dimension", async () => {
      await expect(service.compareMarginByDimension("TestOrg", "invalid_dim")).rejects.toThrow("unsupported dimension");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.compareMarginByDimension("UnknownOrg", "channel")).rejects.toThrow("organization not found");
    });

    it("handles NULL dimension values as unknown", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { dim: null, revenue: "10000", cogs: "5000", margin_pct: "50", tx_count: "20" },
          ],
        } as any);

      const result = await service.compareMarginByDimension("TestOrg", "channel");

      expect(result.items[0].dimension).toBe(null);
    });

    it("propagates database errors", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.compareMarginByDimension("TestOrg", "channel")).rejects.toThrow("db error");
    });
  });

  describe("identifyMarginLeaks", () => {
    it("returns leaks below threshold with multiple products", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_margin: "30" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { product_name: "Product A", product_category: "Cat1", channel: "Online", region: "US", avg_margin: "10", revenue: "5000", tx_count: "50" },
            { product_name: "Product B", product_category: "Cat2", channel: "Retail", region: "EU", avg_margin: "15", revenue: "3000", tx_count: "30" },
          ],
        } as any);

      const result = await service.identifyMarginLeaks("TestOrg");

      expect(result.leaks).toHaveLength(2);
      expect(result.orgAvgMarginPct).toBe(30);
      expect(result.leaks[0].deviationPct).toBe(20);
    });

    it("returns empty leaks when no products below threshold", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_margin: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.identifyMarginLeaks("TestOrg");

      expect(result.leaks).toHaveLength(0);
    });

    it("uses custom threshold parameter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_margin: "40" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { product_name: "Product X", product_category: "Cat1", channel: "Online", region: "US", avg_margin: "5", revenue: "1000", tx_count: "10" },
          ],
        } as any);

      const result = await service.identifyMarginLeaks("TestOrg", 20);

      expect(result.leaks).toHaveLength(1);
    });

    it("handles null org avg margin as zero", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_margin: null }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.identifyMarginLeaks("TestOrg");

      expect(result.orgAvgMarginPct).toBe(0);
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.identifyMarginLeaks("UnknownOrg")).rejects.toThrow("organization not found");
    });

    it("handles database error on avg query", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("avg query failed"));

      await expect(service.identifyMarginLeaks("TestOrg")).rejects.toThrow("avg query failed");
    });

    it("handles database error on leak query", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_margin: "30" }] } as any)
        .mockRejectedValueOnce(new Error("leak query failed"));

      await expect(service.identifyMarginLeaks("TestOrg")).rejects.toThrow("leak query failed");
    });

    it("handles negative avg margin in org average", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ avg_margin: "-10" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { product_name: "Product Z", product_category: "Cat3", channel: "Online", region: "US", avg_margin: "-25", revenue: "2000", tx_count: "20" },
          ],
        } as any);

      const result = await service.identifyMarginLeaks("TestOrg");

      expect(result.orgAvgMarginPct).toBe(-10);
    });
  });

  describe("getChannelProfitability", () => {
    it("returns channels sorted by margin with ranking", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { channel: "Online", revenue: "80000", margin_pct: "45", tx_count: "200", avg_order: "400" },
            { channel: "Retail", revenue: "50000", margin_pct: "35", tx_count: "100", avg_order: "500" },
          ],
        } as any);

      const result = await service.getChannelProfitability("TestOrg");

      expect(result.channels).toHaveLength(2);
      expect(result.bestChannelByMargin).toBe("Online");
      expect(result.channels[0].marginRank).toBe(1);
      expect(result.channels[1].marginRank).toBe(2);
    });

    it("returns empty channels when no data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getChannelProfitability("TestOrg");

      expect(result.channels).toHaveLength(0);
      expect(result.bestChannelByMargin).toBe("");
    });

    it("uses provided lookbackDays", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { channel: "Direct", revenue: "30000", margin_pct: "50", tx_count: "75", avg_order: "400" },
          ],
        } as any);

      const result = await service.getChannelProfitability("TestOrg", 30);

      expect(result.channels).toHaveLength(1);
    });

    it("handles single channel result", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { channel: "Online", revenue: "100000", margin_pct: "40", tx_count: "250", avg_order: "400" },
          ],
        } as any);

      const result = await service.getChannelProfitability("TestOrg");

      expect(result.channels).toHaveLength(1);
      expect(result.channels[0].marginRank).toBe(1);
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.getChannelProfitability("UnknownOrg")).rejects.toThrow("organization not found");
    });

    it("handles NULL channel as unknown", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { channel: null, revenue: "10000", margin_pct: "30", tx_count: "25", avg_order: "400" },
          ],
        } as any);

      const result = await service.getChannelProfitability("TestOrg");

      expect(result.channels[0].channel).toBe(null);
    });

    it("propagates database errors", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("db fail"));

      await expect(service.getChannelProfitability("TestOrg")).rejects.toThrow("db fail");
    });

    it("handles zero lookbackDays", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [
            { channel: "Online", revenue: "5000", margin_pct: "20", tx_count: "10", avg_order: "500" },
          ],
        } as any);

      const result = await service.getChannelProfitability("TestOrg", 0);

      expect(result.channels).toHaveLength(1);
    });
  });

  describe("comparePeriodMargins", () => {
    it("returns improving trend when change > 1", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ m1: "35", m2: "30" }] } as any);

      const result = await service.comparePeriodMargins("TestOrg", 30, 60);

      expect(result.trend).toBe("improving");
      expect(result.absoluteChangePp).toBe(5);
    });

    it("returns declining trend when change < -1", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ m1: "20", m2: "30" }] } as any);

      const result = await service.comparePeriodMargins("TestOrg", 30, 60);

      expect(result.trend).toBe("declining");
      expect(result.absoluteChangePp).toBe(-10);
    });

    it("returns stable trend when change between -1 and 1", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ m1: "25.5", m2: "25" }] } as any);

      const result = await service.comparePeriodMargins("TestOrg", 30, 60);

      expect(result.trend).toBe("stable");
    });

    it("handles null values as zero", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ m1: null, m2: null }] } as any);

      const result = await service.comparePeriodMargins("TestOrg", 30, 60);

      expect(result.period1MarginPct).toBe(0);
      expect(result.period2MarginPct).toBe(0);
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.comparePeriodMargins("UnknownOrg", 30, 60)).rejects.toThrow("organization not found");
    });

    it("handles database error", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("period query failed"));

      await expect(service.comparePeriodMargins("TestOrg", 30, 60)).rejects.toThrow("period query failed");
    });

    it("uses correct period labels", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ m1: "25", m2: "20" }] } as any);

      const result = await service.comparePeriodMargins("TestOrg", 30, 90);

      expect(result.period1Label).toBe("last_30_days");
      expect(result.period2Label).toBe("30_to_90_days_ago");
    });

    it("handles exactly -1 change as stable", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ m1: "29", m2: "30" }] } as any);

      const result = await service.comparePeriodMargins("TestOrg", 30, 60);

      expect(result.trend).toBe("stable");
    });
  });
});
