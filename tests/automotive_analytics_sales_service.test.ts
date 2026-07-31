import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { AutomotiveSalesAnalyticsService } from "../src/services/automotive/automotive_analytics_sales_service";

const mockQuery = query as jest.Mock;

describe("AutomotiveSalesAnalyticsService", () => {
  let service: AutomotiveSalesAnalyticsService;

  beforeEach(() => {
    service = new AutomotiveSalesAnalyticsService();
    jest.clearAllMocks();
  });

  describe("generateSalesPerformanceReport", () => {
    it("returns sales performance report with metrics", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 100, total_revenue: 500000, average_ticket: 5000, total_profit: 100000, average_margin: 20, unique_customers: 50, financed_sales: 30, trade_in_sales: 10, avg_days_to_sell: 15 }] })
        .mockResolvedValueOnce({ rows: [{ period: "2024-01", sales_count: 100 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesPerformanceReport(
        "org1", new Date("2024-01-01"), new Date("2024-12-31"), "month",
      );
      expect(result.report_type).toBe("sales_performance");
      expect(result.metrics.total_sales).toBe(100);
    });

    it("includes time_series when groupBy provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 50 }] })
        .mockResolvedValueOnce({ rows: [{ period: "2024-01-01", sales_count: 50 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesPerformanceReport(
        "org1", new Date("2024-01-01"), new Date("2024-12-31"), "month",
      );
      expect(result.metrics.time_series).toBeDefined();
    });

    it("applies filters correctly", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 10 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesPerformanceReport(
        "org1", new Date("2024-01-01"), new Date("2024-12-31"), "",
        { brand: "toyota", model: "corolla" },
      );
      expect(result.filters).toBeDefined();
    });

    it("returns top_models breakdown", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 50 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ brand: "toyota", model: "corolla", units_sold: 30 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesPerformanceReport(
        "org1", new Date(), new Date(), "",
      );
      expect(result.metrics.top_models).toBeDefined();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateSalesPerformanceReport(
        "org1", new Date(), new Date(), "",
      )).rejects.toThrow("db error");
    });

    it("channel_breakdown is returned", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 50 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ sales_channel: "dealership", units_sold: 30 }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesPerformanceReport(
        "org1", new Date(), new Date(), "",
      );
      expect(result.metrics.channel_breakdown).toBeDefined();
    });

    it("region_breakdown is returned", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 50 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ region: "southeast", units_sold: 40 }] });
      const result = await service.generateSalesPerformanceReport(
        "org1", new Date(), new Date(), "",
      );
      expect(result.metrics.region_breakdown).toBeDefined();
    });
  });

  describe("generateInventoryReport", () => {
    it("returns inventory report", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_inventory: 200 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateInventoryReport(
        "org1", new Date(), {},
      );
      expect(result.report_type).toBe("inventory_analytics");
    });

    it("includes aging analysis", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_inventory: 100 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ aging_bucket: "0-30 days", units: 50 }] });
      const result = await service.generateInventoryReport(
        "org1", new Date(),
      );
      expect(result.metrics.aging_analysis).toBeDefined();
    });

    it("includes turnover history", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_inventory: 100 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ year: 2024, units_sold: 300 }] });
      const result = await service.generateInventoryReport(
        "org1", new Date(),
      );
      expect(result.metrics.turnover_history).toBeDefined();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateInventoryReport("org1", new Date())).rejects.toThrow("db error");
    });
  });

  describe("generateFinancialMetricsReport", () => {
    it("returns financial metrics report", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 100, gross_revenue: 1000000, total_cost: 700000, gross_profit: 300000, avg_margin_percentage: 30, total_commission: 50000, finance_income: 20000, warranty_revenue: 10000, accessories_revenue: 5000 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateFinancialMetricsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.report_type).toBe("financial_metrics");
    });

    it("computes net profit", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_sales: 100, gross_revenue: 1000000, total_cost: 700000, gross_profit: 300000, avg_margin_percentage: 30, total_commission: 50000, finance_income: 20000, warranty_revenue: 10000, accessories_revenue: 5000 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateFinancialMetricsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.net_profit).toBe(285000);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateFinancialMetricsReport(
        "org1", new Date(), new Date(),
      )).rejects.toThrow("db error");
    });

    it("includes brand profitability", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ gross_revenue: 1000 }] })
        .mockResolvedValueOnce({ rows: [{ brand: "toyota", gross_profit: 100 }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateFinancialMetricsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.profitability_by_brand).toBeDefined();
    });
  });

  describe("generateCustomerInsightsReport", () => {
    it("returns customer insights report", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_customers: 100, total_transactions: 500, new_customers: 30, avg_customer_value: 5000, repeat_customers: 40 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateCustomerInsightsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.report_type).toBe("customer_insights");
    });

    it("computes repeat purchase rate", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_customers: 100, total_transactions: 500, new_customers: 30, avg_customer_value: 5000, repeat_customers: 40 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateCustomerInsightsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.repeat_purchase_rate).toBe(40);
    });

    it("handles zero customers gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_customers: 0, total_transactions: 0, new_customers: 0, avg_customer_value: 0, repeat_customers: 0 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateCustomerInsightsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.repeat_purchase_rate).toBe(0);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateCustomerInsightsReport(
        "org1", new Date(), new Date(),
      )).rejects.toThrow("db error");
    });
  });

  describe("generateMarketTrendsReport", () => {
    it("returns market trends report", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateMarketTrendsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.report_type).toBe("market_trends");
    });

    it("includes all metric sections", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateMarketTrendsReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.market_share_by_brand).toBeDefined();
      expect(result.metrics.price_trends).toBeDefined();
      expect(result.metrics.segment_performance).toBeDefined();
      expect(result.metrics.top_configurations).toBeDefined();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateMarketTrendsReport(
        "org1", new Date(), new Date(),
      )).rejects.toThrow("db error");
    });

    it("applies filters", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateMarketTrendsReport(
        "org1", new Date(), new Date(), { brand: "honda" },
      );
      expect(result.filters).toBeDefined();
    });
  });

  describe("generateSalesForecastReport", () => {
    it("returns forecast report", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesForecastReport(
        "org1", "3m", 6,
      );
      expect(result.report_type).toBe("sales_forecast");
    });

    it("generates forecast entries", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.generateSalesForecastReport(
        "org1", "3m", 6,
      );
      expect(result.metrics.forecast).toHaveLength(3);
    });

    it("handles historical data for forecast calculation", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { month: "2024-01", units_sold: 100, total_revenue: 500000 },
          { month: "2024-02", units_sold: 110, total_revenue: 550000 },
          { month: "2024-03", units_sold: 120, total_revenue: 600000 },
        ],
      });
      const result = await service.generateSalesForecastReport(
        "org1", "3m", 6,
      );
      expect(result.metrics.forecast[0].forecasted_units).toBe(110);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateSalesForecastReport(
        "org1", "3m", 6,
      )).rejects.toThrow("db error");
    });
  });

  describe("generateDealershipPerformanceReport", () => {
    it("returns dealership report", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.generateDealershipPerformanceReport(
        "org1", new Date(), new Date(), [],
      );
      expect(result.report_type).toBe("dealership_performance");
    });

    it("filters by dealership IDs", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.generateDealershipPerformanceReport(
        "org1", new Date(), new Date(), ["dealer1", "dealer2"],
      );
      expect(result.metrics.summary.total_dealerships).toBe(0);
    });

    it("computes vs averages for dealerships", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { dealership_id: "d1", dealership_name: "D1", region: "north", tier: "premium",
            units_sold: 100, total_revenue: 1000000, avg_ticket: 10000,
            total_profit: 200000, avg_margin: 20, unique_customers: 50, avg_csat: 85 },
          { dealership_id: "d2", dealership_name: "D2", region: "south", tier: "standard",
            units_sold: 50, total_revenue: 500000, avg_ticket: 10000,
            total_profit: 100000, avg_margin: 20, unique_customers: 25, avg_csat: 80 },
        ],
      });
      const result = await service.generateDealershipPerformanceReport(
        "org1", new Date(), new Date(), [],
      );
      expect(result.metrics.dealerships[0].vs_avg_units).toBeDefined();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateDealershipPerformanceReport(
        "org1", new Date(), new Date(), [],
      )).rejects.toThrow("db error");
    });
  });

  describe("generateProductMixReport", () => {
    it("returns product mix report", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateProductMixReport(
        "org1", new Date(), new Date(),
      );
      expect(result.report_type).toBe("product_mix");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateProductMixReport(
        "org1", new Date(), new Date(),
      )).rejects.toThrow("db error");
    });

    it("includes segment growth", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await service.generateProductMixReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.segment_growth).toBeDefined();
    });
  });

  describe("generateConversionFunnelReport", () => {
    it("returns conversion funnel report", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.generateConversionFunnelReport(
        "org1", new Date(), new Date(),
      );
      expect(result.report_type).toBe("conversion_funnel");
    });

    it("computes conversion rates", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { funnel_stage: "visit", leads: 1000, completed: 800 },
          { funnel_stage: "test_drive", leads: 800, completed: 400 },
          { funnel_stage: "closing", leads: 400, completed: 200 },
        ],
      });
      const result = await service.generateConversionFunnelReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.overall_conversion_rate).toBe(20);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateConversionFunnelReport(
        "org1", new Date(), new Date(),
      )).rejects.toThrow("db error");
    });

    it("handles empty stages", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.generateConversionFunnelReport(
        "org1", new Date(), new Date(),
      );
      expect(result.metrics.total_leads).toBe(0);
    });
  });

  describe("generateExecutiveDashboard", () => {
    function mockSalesPerfMetrics(sales: number, revenue: number, ticket: number) {
      return { rows: [{ total_sales: sales, total_revenue: revenue, average_ticket: ticket, total_profit: 0, average_margin: 0, unique_customers: 0, financed_sales: 0, trade_in_sales: 0, avg_days_to_sell: 0 }] };
    }

    it("returns executive dashboard", async () => {
      mockQuery
        // sales 1: metrics + topModels + channel + region = 4 calls
        .mockResolvedValueOnce(mockSalesPerfMetrics(100, 500000, 5000))
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // sales 2: metrics + topModels + channel + region = 4 calls
        .mockResolvedValueOnce(mockSalesPerfMetrics(80, 400000, 5000))
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // inventory: metrics + byModel + aging + turnover = 4 calls
        .mockResolvedValueOnce({ rows: [{ total_inventory: 200, total_cost: 0, total_market_value: 10000000, avg_value: 0, aging_inventory: 0, avg_days_in_inventory: 0, available_units: 0, reserved_units: 0 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // financial: metrics + brand + finance = 3 calls
        .mockResolvedValueOnce({ rows: [{ total_sales: 100, gross_revenue: 1000000, total_cost: 700000, gross_profit: 300000, avg_margin_percentage: 30, total_commission: 0, finance_income: 0, warranty_revenue: 0, accessories_revenue: 0 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // customer: metrics + segment + preferences = 3 calls
        .mockResolvedValueOnce({ rows: [{ total_customers: 300, total_transactions: 500, new_customers: 30, avg_customer_value: 5000, repeat_customers: 40 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
      const result = await service.generateExecutiveDashboard("org1", "monthly");
      expect(result.dashboard_type).toBe("executive_summary");
    });

    it("generates alerts for sales variance", async () => {
      mockQuery
        // sales 1: 4 calls
        .mockResolvedValueOnce(mockSalesPerfMetrics(50, 100000, 2000))
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // sales 2: 4 calls
        .mockResolvedValueOnce(mockSalesPerfMetrics(100, 200000, 2000))
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // inventory: 4 calls
        .mockResolvedValueOnce({ rows: [{ total_inventory: 100, total_cost: 0, total_market_value: 5000000, avg_value: 0, aging_inventory: 0, avg_days_in_inventory: 0, available_units: 0, reserved_units: 0 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // financial: 3 calls
        .mockResolvedValueOnce({ rows: [{ total_sales: 50, gross_revenue: 200000, total_cost: 100000, gross_profit: 30000, avg_margin_percentage: 30, total_commission: 0, finance_income: 0, warranty_revenue: 0, accessories_revenue: 0 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        // customer: 3 calls
        .mockResolvedValueOnce({ rows: [{ total_customers: 50, total_transactions: 100, new_customers: 10, avg_customer_value: 2000, repeat_customers: 20 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
      await expect(service.generateExecutiveDashboard("org1", "daily")).resolves.toBeDefined();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.generateExecutiveDashboard("org1", "monthly")).rejects.toThrow("db error");
    });
  });

  describe("exportReport", () => {
    it("exports as JSON", async () => {
      const result = await service.exportReport({ report_type: "test" }, "json");
      expect(result.export_format).toBe("json");
    });

    it("exports as CSV", async () => {
      const result = await service.exportReport({
        report_type: "test", period: {}, metrics: { sales: 100 },
      }, "csv");
      expect(result.export_format).toBe("csv");
    });

    it("throws for unsupported format", async () => {
      await expect(service.exportReport({}, "xml" as any)).rejects.toThrow(
        "unsupported export format: xml"
      );
    });

    it("includes filename in JSON export", async () => {
      const result = await service.exportReport({ report_type: "test" }, "json");
      expect(result.filename).toContain(".json");
    });
  });

  describe("generateExecutiveDashboard alerts", () => {
    function mockSalesWithDays(avgDays: number) {
      return { rows: [{ total_sales: 100, total_revenue: 500000, average_ticket: 5000, total_profit: 0, average_margin: 0, unique_customers: 0, financed_sales: 0, trade_in_sales: 0, avg_days_to_sell: avgDays }] };
    }

    it("generates alerts for avg days to sell", async () => {
      mockQuery
        .mockResolvedValueOnce(mockSalesWithDays(120)).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(mockSalesWithDays(30)).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total_inventory: 200, total_cost: 0, total_market_value: 10000000, avg_value: 0, aging_inventory: 0, avg_days_in_inventory: 0, available_units: 0, reserved_units: 0 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total_sales: 100, gross_revenue: 1000000, total_cost: 700000, gross_profit: 300000, avg_margin_percentage: 30, total_commission: 0, finance_income: 0, warranty_revenue: 0, accessories_revenue: 0 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total_customers: 300, total_transactions: 500, new_customers: 30, avg_customer_value: 5000, repeat_customers: 40 }] })
        .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
      const result = await service.generateExecutiveDashboard("org1", "monthly");
      expect(result.alerts).toBeDefined();
    });
  });
});
