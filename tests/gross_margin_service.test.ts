import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
}));

import { GrossMarginService, type GrossMarginFilter } from "../src/services/kpis/gross_margin_service";
import { query } from "../src/services/db";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("GrossMarginService", () => {
  let service: GrossMarginService;
  const baseFilter: GrossMarginFilter = {
    organization_name: "TestOrg",
    start_date: new Date("2024-01-01"),
    end_date: new Date("2024-12-31"),
    period_type: "annual",
    margin_type: "gross",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GrossMarginService();
  });

  describe("CalculateGrossMargin", () => {
    it("returns full metrics for valid filter with all breakdowns", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "100000",
            total_cost: "60000",
            total_direct_material: "20000",
            total_direct_labor: "15000",
            total_manufacturing: "10000",
            total_freight_in: "5000",
            total_royalties: "3000",
            total_commission: "2000",
            total_shipping: "3000",
            total_payment_fees: "1000",
            total_packaging: "500",
            total_fixed_allocated: "500",
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "80000", total_cost: "50000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "90000", total_cost: "55000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.CalculateGrossMargin(baseFilter);

      expect(result.total_revenue).toBe(100000);
      expect(result.gross_margin_percent).toBe(40);
      expect(result.gross_profit).toBe(40000);
      expect(result.cost_breakdown.direct_materials).toBe(20000);
    });

    it("returns zero margin when revenue is zero", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            total_revenue: "0",
            total_cost: "0",
            total_direct_material: "0",
            total_direct_labor: "0",
            total_manufacturing: "0",
            total_freight_in: "0",
            total_royalties: "0",
            total_commission: "0",
            total_shipping: "0",
            total_payment_fees: "0",
            total_packaging: "0",
            total_fixed_allocated: "0",
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", total_cost: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", total_cost: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: "0" }] } as any);

      const result = await service.CalculateGrossMargin(baseFilter);

      expect(result.gross_margin_percent).toBe(0);
      expect(result.gross_profit).toBe(0);
    });

    it("includes previous period and YoY margin calculations", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", total_cost: "60000", total_direct_material: "0", total_direct_labor: "0", total_manufacturing: "0", total_freight_in: "0", total_royalties: "0", total_commission: "0", total_shipping: "0", total_payment_fees: "0", total_packaging: "0", total_fixed_allocated: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "80000", total_cost: "56000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "90000", total_cost: "63000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.CalculateGrossMargin(baseFilter);

      expect(result.previous_period_margin).toBe(30);
      expect(result.yoy_previous_margin).toBe(30);
      expect(result.margin_change_points).toBe(10);
    });

    it("applies optional filters for product_category", async () => {
      const filterWithCategory = { ...baseFilter, product_category: "Electronics" };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "50000", total_cost: "30000", total_direct_material: "0", total_direct_labor: "0", total_manufacturing: "0", total_freight_in: "0", total_royalties: "0", total_commission: "0", total_shipping: "0", total_payment_fees: "0", total_packaging: "0", total_fixed_allocated: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", total_cost: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", total_cost: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: "50000" }] } as any);

      const result = await service.CalculateGrossMargin(filterWithCategory);

      expect(result.total_revenue).toBe(50000);
    });

    it("throws when organization_name is empty", async () => {
      await expect(service.CalculateGrossMargin({ ...baseFilter, organization_name: "" })).rejects.toThrow("organization_name is required");
    });

    it("throws when start_date or end_date missing", async () => {
      await expect(service.CalculateGrossMargin({ ...baseFilter, start_date: null as any })).rejects.toThrow("start_date and end_date are required");
      await expect(service.CalculateGrossMargin({ ...baseFilter, end_date: null as any })).rejects.toThrow("start_date and end_date are required");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.CalculateGrossMargin(baseFilter)).rejects.toThrow("organization not found with name");
    });

    it("handles errors in breakdown queries gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", total_cost: "60000", total_direct_material: "0", total_direct_labor: "0", total_manufacturing: "0", total_freight_in: "0", total_royalties: "0", total_commission: "0", total_shipping: "0", total_payment_fees: "0", total_packaging: "0", total_fixed_allocated: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", total_cost: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", total_cost: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total: "100000" }] } as any)
        .mockRejectedValueOnce(new Error("product query failed"));

      const result = await service.CalculateGrossMargin(baseFilter);

      expect(result.total_revenue).toBe(100000);
      expect(result.by_product).toBeUndefined();
    });

    it("handles database error on main query", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("main query failed"));

      await expect(service.CalculateGrossMargin(baseFilter)).rejects.toThrow("main query failed");
    });
  });

  describe("CalculateMarginForecast", () => {
    const histRow = (year: number, month: number, margin: number) => ({
      year: String(year),
      month_num: String(month),
      month: new Date(year, month - 1),
      monthly_revenue: "10000",
      monthly_cost: String(10000 - (10000 * margin / 100)),
      margin_percent: String(margin),
    });

    it("returns forecast with seasonality for 24+ months of data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      const rows = [];
      for (let m = 1; m <= 24; m++) {
        const baseMonth = ((m - 1) % 12) + 1;
        const margin = baseMonth <= 3 ? 15 : (baseMonth <= 9 ? 45 : 30);
        rows.push(histRow(2023, baseMonth, margin));
      }
      mockQuery.mockResolvedValueOnce({ rows } as any);

      const result = await service.CalculateMarginForecast(baseFilter);

      expect(result.seasonality_detected).toBe(true);
      expect(result.seasonality_pattern).toBeDefined();
      expect(result.seasonality_pattern!.length).toBeGreaterThan(0);
      expect(result.trend_direction).toMatch(/^(up|down|stable)$/);
    });

    it("returns forecast without seasonality for less than 24 months", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      const rows = [];
      for (let m = 1; m <= 12; m++) {
        rows.push(histRow(2024, m, 25 + m));
      }
      mockQuery.mockResolvedValueOnce({ rows } as any);

      const result = await service.CalculateMarginForecast(baseFilter);

      expect(result.seasonality_detected).toBe(false);
      expect(result.methodology).toBe("linear_regression_with_seasonality");
    });

    it("projects next month, quarter and year values", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      const rows = [];
      for (let m = 1; m <= 24; m++) {
        rows.push(histRow(2024, ((m - 1) % 12) + 1, 30));
      }
      mockQuery.mockResolvedValueOnce({ rows } as any);

      const result = await service.CalculateMarginForecast(baseFilter);

      expect(result.next_month).toBeGreaterThan(-50);
      expect(result.next_month).toBeLessThanOrEqual(100);
      expect(result.next_quarter).toBeGreaterThan(-50);
      expect(result.next_year).toBeGreaterThan(-50);
    });

    it("returns confidence interval and RMSE", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      const rows = [];
      for (let m = 1; m <= 24; m++) {
        rows.push(histRow(2024, ((m - 1) % 12) + 1, 30 + (m % 5)));
      }
      mockQuery.mockResolvedValueOnce({ rows } as any);

      const result = await service.CalculateMarginForecast(baseFilter);

      expect(result.confidence_lower).toBeLessThan(result.confidence_upper);
      expect(result.rmse).toBeGreaterThanOrEqual(0);
    });

    it("throws when organization_name is missing", async () => {
      await expect(service.CalculateMarginForecast({ ...baseFilter, organization_name: "" })).rejects.toThrow("organization_name is required");
    });

    it("throws when start_date after end_date", async () => {
      const badFilter = { ...baseFilter, start_date: new Date("2024-06-01"), end_date: new Date("2024-01-01") };
      await expect(service.CalculateMarginForecast(badFilter)).rejects.toThrow("start_date must be before end_date");
    });

    it("throws when insufficient historical data (< 12 months)", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [histRow(2024, 1, 30)] } as any);

      await expect(service.CalculateMarginForecast(baseFilter)).rejects.toThrow("insufficient historical data for forecast");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.CalculateMarginForecast(baseFilter)).rejects.toThrow("organization not found with name");
    });
  });
});
