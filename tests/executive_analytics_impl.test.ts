import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { ExecutiveAnalyticsImpl } from "../src/services/ai/executive_analytics_impl";
import { query } from "../src/services/db";

describe("ExecutiveAnalyticsImpl", () => {
  let analytics: ExecutiveAnalyticsImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = new ExecutiveAnalyticsImpl();
  });

  describe("compareSeasonality", () => {
    it("returns seasonality analysis with data", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { year: 2023, period_key: 1, period_name: "January", total_sales: 1000 },
          { year: 2024, period_key: 1, period_name: "January", total_sales: 1200 },
        ],
      });
      const result = await analytics.compareSeasonality({ organizationId: "org-1", granularity: "month", compareYears: [2023, 2024] });
      expect(result.seasonalPatterns).toBeDefined();
      expect(result.peakPeriods).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it("throws when organizationId is empty", async () => {
      await expect(analytics.compareSeasonality({ organizationId: "", granularity: "month", compareYears: [] })).rejects.toThrow("organization_id is required");
    });

    it("handles empty query result", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await analytics.compareSeasonality({ organizationId: "org-1", granularity: "month", compareYears: [] });
      expect(result.seasonalPatterns).toEqual({});
    });

    it("handles quarter granularity", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ year: 2024, period_key: 1, period_name: "Q1", total_sales: 5000 }],
      });
      const result = await analytics.compareSeasonality({ organizationId: "org-1", granularity: "quarter", compareYears: [] });
      expect(result.seasonalPatterns).toBeDefined();
    });
  });

  describe("calculateGrowth", () => {
    it("calculates growth correctly", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 1000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 2000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 1000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 2000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 1000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 2000 }] });
      const result = await analytics.calculateGrowth({
        organizationId: "org-1", startDate: new Date("2024-01-01"), endDate: new Date("2024-01-03"), interval: "day", includeCAGR: true,
      });
      expect(result.absoluteGrowth).toBe(1000);
      expect(result.percentageGrowth).toBe(100);
    });

    it("throws when organizationId is empty", async () => {
      await expect(analytics.calculateGrowth({ organizationId: "", startDate: new Date(), endDate: new Date(), interval: "month", includeCAGR: false })).rejects.toThrow("organization_id is required");
    });

    it("handles zero start value for growth", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 500 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 500 }] });
      const result = await analytics.calculateGrowth({
        organizationId: "org-1", startDate: new Date("2024-01-01"), endDate: new Date("2024-01-02"), interval: "day", includeCAGR: false,
      });
      expect(result.percentageGrowth).toBe(0);
    });

    it("uses default interval", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 200 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 200 }] });
      const result = await analytics.calculateGrowth({
        organizationId: "org-1", startDate: new Date("2024-01-01"), endDate: new Date("2024-01-02"), interval: "", includeCAGR: false,
      });
      expect(result.absoluteGrowth).toBe(100);
    });
  });

  describe("comparePeriods", () => {
    it("compares two periods", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 1000, days: 30 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ date: new Date(), val: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 1500, days: 30 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ date: new Date(), val: 150 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await analytics.comparePeriods({
        organizationId: "org-1",
        period1: { label: "P1", startDate: new Date("2024-01-01"), endDate: new Date("2024-01-31") },
        period2: { label: "P2", startDate: new Date("2024-02-01"), endDate: new Date("2024-02-28") },
        groupBy: "",
      });
      expect(result.absoluteDifference).toBe(500);
    });

    it("throws when organizationId is empty", async () => {
      await expect(analytics.comparePeriods({
        organizationId: "",
        period1: { label: "P1", startDate: new Date(), endDate: new Date() },
        period2: { label: "P2", startDate: new Date(), endDate: new Date() },
        groupBy: "",
      })).rejects.toThrow("organization_id is required");
    });

    it("handles zero totalValue", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0, days: 1 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ date: new Date(), val: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0, days: 1 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ date: new Date(), val: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await analytics.comparePeriods({
        organizationId: "org-1",
        period1: { label: "P1", startDate: new Date(), endDate: new Date() },
        period2: { label: "P2", startDate: new Date(), endDate: new Date() },
        groupBy: "",
      });
      expect(result.percentageDifference).toBe(0);
    });
  });

  describe("getExecutiveSummary", () => {
    it("returns executive summary", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 10000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 8000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 2000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 1500 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 5000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 4000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ avg: 1000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ avg: 800 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await analytics.getExecutiveSummary({ organizationId: "org-1", currentDate: new Date(), lookbackDays: 90 });
      expect(result.currentPeriod.totalValue).toBe(10000);
      expect(result.executiveRecommendations).toBeDefined();
    });

    it("throws when organizationId is empty", async () => {
      await expect(analytics.getExecutiveSummary({ organizationId: "", currentDate: new Date(), lookbackDays: 90 })).rejects.toThrow("organization_id is required");
    });

    it("handles zero previous value", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 20 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 50 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ avg: 10 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ avg: 5 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await analytics.getExecutiveSummary({ organizationId: "org-1", currentDate: new Date(), lookbackDays: 30 });
      expect(result.currentPeriod.vsPreviousPercent).toBe(0);
    });

    it("uses default lookbackDays when not provided", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 50 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 30 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 20 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: 50 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ avg: 50 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ avg: 30 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const req = { organizationId: "org-1", currentDate: new Date() } as any;
      const result = await analytics.getExecutiveSummary(req);
      expect(result.currentPeriod.periodLabel).toBe("Last 90 days");
    });
  });
});
