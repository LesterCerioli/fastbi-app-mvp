import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
}));

import { KpiDeviationAnalyzerService } from "../src/services/kpis/kpi_deviation_analyzer_service";
import { query } from "../src/services/db";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("KpiDeviationAnalyzerService", () => {
  let service: KpiDeviationAnalyzerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KpiDeviationAnalyzerService();
  });

  describe("analyzeKpiDeviation", () => {
    it("returns alerts when deviation exceeds thresholds", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "150" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            kpi_id: "kpi-1",
            upper_deviation_threshold: 30,
            lower_deviation_threshold: null,
            upper_percent_threshold: null,
            lower_percent_threshold: null,
            severity: "warning",
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ name: "Revenue", category: "financial" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "alert-1" }] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-1"]);

      expect(result.alerts).toHaveLength(1);
      expect(result.totalKPIsChecked).toBe(1);
      expect(result.alerts[0].kpiName).toBe("Revenue");
    });

    it("returns alerts for deviations exceeding percent thresholds", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "200" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            kpi_id: "kpi-1",
            upper_deviation_threshold: null,
            lower_deviation_threshold: null,
            upper_percent_threshold: 50,
            lower_percent_threshold: null,
            severity: "critical",
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ name: "Growth", category: "operational" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "alert-2" }] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-1"]);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe("critical");
    });

    it("creates alert when no thresholds defined but deviation exists", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "80" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ name: "Test KPI", category: "test" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "alert-3" }] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-1"]);

      expect(result.alerts).toHaveLength(1);
    });

    it("processes multiple KPIs and returns multiple alerts", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "150" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ name: "KPI One", category: "cat1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "30" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ name: "KPI Two", category: "cat2" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "alert-4" }] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-1", "kpi-2"]);

      expect(result.alerts).toHaveLength(2);
      expect(result.totalKPIsChecked).toBe(2);
    });

    it("skips KPI when kpiInfo returns null", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-invalid"]);

      expect(result.alerts).toHaveLength(0);
    });

    it("skips alert when current value is null", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ name: "Test", category: "cat" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "alert-5" }] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-1"]);

      expect(result.alerts).toHaveLength(0);
    });

    it("handles previous value as 0 to avoid division by zero", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ name: "Test", category: "cat" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "alert-6" }] } as any);

      const result = await service.analyzeKpiDeviation("org-1", ["kpi-1"]);

      expect(result.alerts).toHaveLength(1);
    });

    it("propagates database error on insert", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: "150" }] } as any)
        .mockResolvedValueOnce({ rows: [{ value: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ name: "Test", category: "cat" }] } as any)
        .mockRejectedValueOnce(new Error("insert failed"));

      await expect(service.analyzeKpiDeviation("org-1", ["kpi-1"])).rejects.toThrow("insert failed");
    });
  });

  describe("getDeviationAlertHistory", () => {
    it("returns alerts from stored JSON with optional kpiID filter", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          alerts_json: JSON.stringify([
            { kpiID: "kpi-1", kpiName: "Revenue", category: "financial", currentValue: 100, previousValue: 80, deviation: 20, deviationPerc: 25, severity: "warning", message: "Revenue change" },
          ]),
        }],
      } as any);

      const result = await service.getDeviationAlertHistory("org-1", "kpi-1");

      expect(result).toHaveLength(1);
      expect(result[0].kpiName).toBe("Revenue");
    });

    it("returns all alerts when no kpiID filter provided", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          alerts_json: JSON.stringify([
            { kpiID: "kpi-1", kpiName: "A", category: "c1", currentValue: 10, previousValue: 5, deviation: 5, deviationPerc: 100, severity: "info", message: "A change" },
            { kpiID: "kpi-2", kpiName: "B", category: "c2", currentValue: 20, previousValue: 10, deviation: 10, deviationPerc: 100, severity: "info", message: "B change" },
          ]),
        }],
      } as any);

      const result = await service.getDeviationAlertHistory("org-1");

      expect(result).toHaveLength(2);
    });

    it("filters alerts by kpiID when provided", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          alerts_json: JSON.stringify([
            { kpiID: "kpi-1", kpiName: "A", category: "c1", currentValue: 10, previousValue: 5, deviation: 5, deviationPerc: 100, severity: "info", message: "A change" },
            { kpiID: "kpi-2", kpiName: "B", category: "c2", currentValue: 20, previousValue: 10, deviation: 10, deviationPerc: 100, severity: "info", message: "B change" },
          ]),
        }],
      } as any);

      const result = await service.getDeviationAlertHistory("org-1", "kpi-2");

      expect(result).toHaveLength(1);
      expect(result[0].kpiID).toBe("kpi-2");
    });

    it("returns empty array when no alert rows", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getDeviationAlertHistory("org-1");

      expect(result).toHaveLength(0);
    });

    it("returns empty array when kpiID does not match any alert", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          alerts_json: JSON.stringify([
            { kpiID: "kpi-1", kpiName: "A", category: "c1", currentValue: 10, previousValue: 5, deviation: 5, deviationPerc: 100, severity: "info", message: "A change" },
          ]),
        }],
      } as any);

      const result = await service.getDeviationAlertHistory("org-1", "nonexistent");

      expect(result).toHaveLength(0);
    });

    it("handles string alerts_json parsing", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ alerts_json: "[]" }],
      } as any);

      const result = await service.getDeviationAlertHistory("org-1");

      expect(result).toHaveLength(0);
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getDeviationAlertHistory("org-1")).rejects.toThrow("db error");
    });

    it("uses provided limit parameter", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.getDeviationAlertHistory("org-1", undefined, 10);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ["org-1", 10]);
    });
  });

  describe("setDeviationThreshold", () => {
    it("inserts threshold with all parameters", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.setDeviationThreshold("kpi-1", "org-1", 50, -10, 100, -20, "critical");

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        ["kpi-1", "org-1", 50, -10, 100, -20, "critical"]
      );
    });

    it("inserts threshold with default severity", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.setDeviationThreshold("kpi-1", "org-1", 30);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ["kpi-1", "org-1", 30, undefined, undefined, undefined, "info"]
      );
    });

    it("inserts threshold with partial thresholds", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.setDeviationThreshold("kpi-1", "org-1", undefined, -20);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ["kpi-1", "org-1", undefined, -20, undefined, undefined, "info"]
      );
    });

    it("uses ON CONFLICT for upsert behavior", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.setDeviationThreshold("kpi-1", "org-1", 50, -10, 100, -20, "warning");

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT"),
        expect.any(Array)
      );
    });

    it("handles database error", async () => {
      mockQuery.mockRejectedValueOnce(new Error("insert failed"));

      await expect(service.setDeviationThreshold("kpi-1", "org-1")).rejects.toThrow("insert failed");
    });

    it("accepts null/undefined parameters", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.setDeviationThreshold("kpi-1", "org-1");

      expect(mockQuery).toHaveBeenCalled();
    });

    it("propagates database error on upsert", async () => {
      mockQuery.mockRejectedValueOnce(new Error("upsert error"));

      await expect(service.setDeviationThreshold("kpi-1", "org-1", 10)).rejects.toThrow("upsert error");
    });
  });
});
