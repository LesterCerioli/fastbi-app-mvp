import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { query } from "../src/services/db";
import { AutomotiveWorkflowAnalyzerService } from "../src/services/automotive/automotive_workflow_analyzer_service";

const mockQuery = query as jest.Mock;

describe("AutomotiveWorkflowAnalyzerService", () => {
  let service: AutomotiveWorkflowAnalyzerService;

  beforeEach(() => {
    service = new AutomotiveWorkflowAnalyzerService();
    jest.clearAllMocks();
  });

  describe("getFleetUtilizationStatus", () => {
    it("returns fleet utilization with rates", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { status: "active", count: 50 },
          { status: "completed", count: 30 },
          { status: "overdue", count: 20 },
        ],
      });
      const result = await service.getFleetUtilizationStatus("Org");
      expect(result.organization_name).toBe("Org");
      expect(result.total_workflows).toBe(100);
      expect(result.active_rate_pct).toBe(50);
      expect(result.completion_rate_pct).toBe(30);
      expect(result.overdue_rate_pct).toBe(20);
    });

    it("handles empty status counts", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getFleetUtilizationStatus("Org");
      expect(result.total_workflows).toBe(0);
      expect(result.active_rate_pct).toBe(0);
    });

    it("throws when org name empty", async () => {
      await expect(service.getFleetUtilizationStatus("")).rejects.toThrow(
        "organization_name is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getFleetUtilizationStatus("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getFleetUtilizationStatus("Org")).rejects.toThrow("db error");
    });
  });

  describe("getOverdueRentals", () => {
    it("returns overdue rentals list", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { workflow_id: "wf1", name: "Rental A", status: "overdue", overdue_days: 10, customer_id: "c1" },
          { workflow_id: "wf2", name: "Rental B", status: "active", overdue_days: 5, customer_id: "c2" },
        ],
      });
      const result = await service.getOverdueRentals("Org");
      expect(result.organization_name).toBe("Org");
      expect(result.count).toBe(2);
      expect(result.rentals[0].workflow_id).toBe("wf1");
    });

    it("handles no overdue rentals", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getOverdueRentals("Org");
      expect(result.count).toBe(0);
      expect(result.rentals).toEqual([]);
    });

    it("throws when org name empty", async () => {
      await expect(service.getOverdueRentals("")).rejects.toThrow(
        "organization_name is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getOverdueRentals("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getOverdueRentals("Org")).rejects.toThrow("db error");
    });
  });

  describe("getRentalDurationPatterns", () => {
    it("returns duration stats", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ avg_duration_days: 7.5, min_duration_days: 1, max_duration_days: 30, sample_count: 50 }],
      });
      const result = await service.getRentalDurationPatterns("Org", 90);
      expect(result.organization_name).toBe("Org");
      expect(result.lookback_days).toBe(90);
      expect(result.overall.avg_duration_days).toBe(7.5);
    });

    it("handles empty lookback result", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ avg_duration_days: 0, min_duration_days: 0, max_duration_days: 0, sample_count: 0 }],
      });
      const result = await service.getRentalDurationPatterns("Org", 0);
      expect(result.overall.sample_count).toBe(0);
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getRentalDurationPatterns("Unknown", 30)).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getRentalDurationPatterns("Org", 30)).rejects.toThrow("db error");
    });
  });

  describe("compareCompletionByStatus", () => {
    it("returns completion comparison by status", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { status: "completed", cnt: 80, avg_duration_sec: 3600 },
          { status: "active", cnt: 15, avg_duration_sec: 7200 },
          { status: "overdue", cnt: 5, avg_duration_sec: 0 },
        ],
      });
      const result = await service.compareCompletionByStatus("Org");
      expect(result.organization_name).toBe("Org");
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].status).toBe("completed");
      expect(result.rows[1].avg_duration_sec).toBe(7200);
    });

    it("handles single status", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ status: "completed", cnt: 100, avg_duration_sec: 1800 }],
      });
      const result = await service.compareCompletionByStatus("Org");
      expect(result.rows).toHaveLength(1);
    });

    it("throws when org name empty", async () => {
      await expect(service.compareCompletionByStatus("")).rejects.toThrow(
        "organization_name is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.compareCompletionByStatus("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.compareCompletionByStatus("Org")).rejects.toThrow("db error");
    });
  });
});
