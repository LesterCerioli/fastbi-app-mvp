import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { ExportSalesRecordsService } from "../src/services/data_engineering/export_sales_records_service";
import { query } from "../src/services/db";

describe("ExportSalesRecordsService", () => {
  let service: ExportSalesRecordsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportSalesRecordsService();
  });

  describe("exportSalesRecords", () => {
    it("returns export result with data", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 1 }] });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: "rec-1", organization_id: "org-1", amount: 100, date: new Date("2024-01-01"),
          category: "Food", product_id: "p1", region: "North", channel: "Online",
          customer_segment: "Retail", quantity: 2, metadata: null, created_at: new Date(), updated_at: new Date(),
        }],
      });
      const result = await service.exportSalesRecords({ organization_id: "org-1" }, 100, 0);
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.total_records).toBe(1);
    });

    it("handles negative offset", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.exportSalesRecords({}, 100, -1);
      expect(result.success).toBe(true);
    });

    it("applies all filters correctly", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.exportSalesRecords({
        organization_id: "org-1", start_date: "2024-01-01", end_date: "2024-12-31",
        category: "Electronics", product_id: "p1", region: "West", channel: "Store",
        customer_segment: "VIP", min_amount: 10, max_amount: 1000, min_quantity: 1, max_quantity: 100,
      });
      expect(result.filters.category).toBe("Electronics");
      expect(result.success).toBe(true);
    });

    it("includes metadata filters in query", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.exportSalesRecords({ metadata_filters: { source: "web" } });
      expect(result.success).toBe(true);
    });
  });

  describe("getExportStats", () => {
    it("returns statistics", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          total_records: 50, total_amount: 5000, avg_amount: 100,
          distinct_categories: 5, distinct_products: 10, distinct_regions: 3,
          distinct_channels: 2, earliest_date: new Date("2024-01-01"), latest_date: new Date("2024-12-31"),
        }],
      });
      const stats = await service.getExportStats("org-1", new Date("2024-01-01"), new Date("2024-12-31"));
      expect(stats.total_records).toBe(50);
      expect(stats.date_range.earliest).toBeDefined();
    });

    it("handles empty date range gracefully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          total_records: 0, total_amount: 0, avg_amount: 0,
          distinct_categories: 0, distinct_products: 0, distinct_regions: 0,
          distinct_channels: 0, earliest_date: null, latest_date: null,
        }],
      });
      const stats = await service.getExportStats("org-1", new Date("2020-01-01"), new Date("2020-01-02"));
      expect(stats.total_records).toBe(0);
    });
  });

  describe("exportSalesRecordsStream", () => {
    it("streams data in batches", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 2 }] });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: "rec-1", organization_id: "org-1", amount: 100, date: new Date(),
          category: "A", product_id: null, region: null, channel: null,
          customer_segment: null, quantity: null, metadata: null, created_at: null, updated_at: null,
        }],
      });
      const callback = jest.fn();
      await service.exportSalesRecordsStream({ organization_id: "org-1" }, 10, callback);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("handles empty results", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0 }] });
      const callback = jest.fn();
      await service.exportSalesRecordsStream({}, 10, callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
