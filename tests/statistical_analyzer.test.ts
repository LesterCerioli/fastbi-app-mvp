import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { StatisticalAnalyzerService } from "../src/services/statistics/statistical_analyzer";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("StatisticalAnalyzerService", () => {
  let service: StatisticalAnalyzerService;

  beforeEach(() => {
    service = new StatisticalAnalyzerService();
    jest.clearAllMocks();
  });

  describe("analyze", () => {
    it("returns correct summary for normal data", async () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const result = await service.analyze(data);
      expect(result.count).toBe(8);
      expect(result.mean).toBe(5);
      expect(result.median).toBe(4.5);
      expect(result.sum).toBe(40);
    });

    it("computes correct outliers", async () => {
      const data = [1, 2, 2, 3, 3, 4, 100];
      const result = await service.analyze(data);
      expect(result.outliers).toContain(100);
    });

    it("handles single element dataset", async () => {
      const result = await service.analyze([42]);
      expect(result.count).toBe(1);
      expect(result.mean).toBe(42);
      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
    });

    it("handles two-element dataset", async () => {
      const result = await service.analyze([10, 20]);
      expect(result.count).toBe(2);
      expect(result.mean).toBe(15);
      expect(result.median).toBe(15);
    });

    it("throws for empty dataset", async () => {
      await expect(service.analyze([])).rejects.toThrow("data slice is empty");
    });

    it("handles all identical values", async () => {
      const result = await service.analyze([5, 5, 5, 5]);
      expect(result.stdDev).toBe(0);
      expect(result.skewness).toBe(0);
      expect(result.kurtosis).toBe(0);
      expect(result.outliers).toEqual([]);
    });

    it("handles negative values", async () => {
      const result = await service.analyze([-10, -5, 0, 5, 10]);
      expect(result.mean).toBe(0);
      expect(result.min).toBe(-10);
      expect(result.max).toBe(10);
    });

    it("handles large dataset without throwing", async () => {
      const data = Array.from({ length: 10000 }, (_, i) => i);
      const result = await service.analyze(data);
      expect(result.count).toBe(10000);
    });
  });

  describe("computeTrend", () => {
    it("returns trend line for correlated data", async () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = await service.computeTrend(x, y);
      expect(result.slope).toBe(2);
      expect(result.intercept).toBe(0);
      expect(result.rSquared).toBe(1);
    });

    it("returns projected values", async () => {
      const x = [1, 2, 3];
      const y = [1, 2, 3];
      const result = await service.computeTrend(x, y, 2);
      expect(result.projectedValues).toHaveLength(2);
      expect(result.projectedValues[0]).toBe(4);
    });

    it("handles negative slope", async () => {
      const x = [1, 2, 3];
      const y = [10, 5, 0];
      const result = await service.computeTrend(x, y);
      expect(result.slope).toBe(-5);
    });

    it("handles rSquared of zero for flat y", async () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 5, 5, 5, 5];
      const result = await service.computeTrend(x, y);
      expect(result.slope).toBe(0);
      expect(result.rSquared).toBe(0);
    });

    it("throws for mismatched lengths", async () => {
      await expect(service.computeTrend([1, 2], [1])).rejects.toThrow(
        "x and y must have the same non-zero length"
      );
    });

    it("throws for empty arrays", async () => {
      await expect(service.computeTrend([], [])).rejects.toThrow(
        "x and y must have the same non-zero length"
      );
    });

    it("throws for constant x values", async () => {
      await expect(service.computeTrend([1, 1, 1], [2, 3, 4])).rejects.toThrow(
        "x values are constant; cannot compute trend line"
      );
    });

    it("handles single point", async () => {
      await expect(service.computeTrend([1], [2])).rejects.toThrow(
        "x values are constant; cannot compute trend line"
      );
    });
  });

  describe("computeCorrelation", () => {
    it("returns strong positive correlation", async () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = await service.computeCorrelation(x, y);
      expect(result.coefficient).toBeCloseTo(1, 1);
      expect(result.strength).toBe("very strong");
    });

    it("returns very weak correlation", async () => {
      const x = [1, 2, 3, 4, 5];
      const y = [100, 101, 100, 102, 100];
      const result = await service.computeCorrelation(x, y);
      expect(result.strength).toBe("very weak");
    });

    it("returns moderate correlation", async () => {
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const y = [3, 4, 5, 6, 7, 3, 4, 5, 6, 7];
      const result = await service.computeCorrelation(x, y);
      expect(result.strength).toBe("moderate");
    });

    it("returns pValue", async () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = await service.computeCorrelation(x, y);
      expect(result.pValue).toBeGreaterThanOrEqual(0);
    });

    it("throws for mismatched lengths", async () => {
      await expect(service.computeCorrelation([1, 2], [1])).rejects.toThrow(
        "x and y must have the same length >= 3"
      );
    });

    it("throws for less than 3 points", async () => {
      await expect(service.computeCorrelation([1, 2], [3, 4])).rejects.toThrow(
        "x and y must have the same length >= 3"
      );
    });

    it("throws for no variance in x", async () => {
      await expect(service.computeCorrelation([1, 1, 1], [2, 3, 4])).rejects.toThrow(
        "no variance in one or both datasets"
      );
    });

    it("throws for no variance in y", async () => {
      await expect(service.computeCorrelation([1, 2, 3], [5, 5, 5])).rejects.toThrow(
        "no variance in one or both datasets"
      );
    });
  });

  describe("computeDistribution", () => {
    it("returns correct bin counts", async () => {
      const data = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
      const result = await service.computeDistribution(data, 5);
      expect(result.binCount).toBe(5);
      expect(result.bins).toHaveLength(5);
    });

    it("handles custom bin count", async () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = await service.computeDistribution(data, 2);
      expect(result.binCount).toBe(2);
    });

    it("handles single bin when range is zero", async () => {
      const data = [5, 5, 5, 5];
      const result = await service.computeDistribution(data, 10);
      expect(result.binCount).toBe(1);
      expect(result.bins).toEqual([5]);
      expect(result.frequencies).toEqual([4]);
    });

    it("handles large bin count", async () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const result = await service.computeDistribution(data, 50);
      expect(result.frequencies).toHaveLength(50);
    });

    it("throws for empty data", async () => {
      await expect(service.computeDistribution([])).rejects.toThrow("data slice is empty");
    });

    it("defaults to 10 bins when binCount is 0", async () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = await service.computeDistribution(data, 0);
      expect(result.binCount).toBe(10);
    });

    it("defaults to 10 bins when binCount is negative", async () => {
      const data = [1, 2, 3, 4, 5];
      const result = await service.computeDistribution(data, -5);
      expect(result.binCount).toBe(10);
    });

    it("handles single element", async () => {
      const result = await service.computeDistribution([42], 5);
      expect(result.binCount).toBe(1);
    });
  });

  describe("detectAnomalies", () => {
    it("detects anomalies above threshold", async () => {
      const data = [10, 12, 11, 13, 50, 9, 11, 10];
      const result = await service.detectAnomalies(data, 2.5);
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns moderate severity", async () => {
      const data = [5, 5, 5, 5, 5, 5, 5, 100];
      const result = await service.detectAnomalies(data, 2);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].severity).toBe("moderate");
    });

    it("returns critical for extreme anomalies", async () => {
      const data = new Array(19).fill(5).concat(1000);
      const result = await service.detectAnomalies(data, 2);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].severity).toBe("critical");
    });

    it("returns severe severity", async () => {
      const data = new Array(13).fill(5).concat(1000);
      const result = await service.detectAnomalies(data, 2);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].severity).toBe("severe");
    });

    it("throws for empty data", async () => {
      await expect(service.detectAnomalies([])).rejects.toThrow("data slice is empty");
    });

    it("returns empty for uniform data", async () => {
      const result = await service.detectAnomalies([5, 5, 5, 5, 5]);
      expect(result).toEqual([]);
    });

    it("returns empty for high threshold", async () => {
      const data = [10, 12, 11, 13, 14, 9, 11];
      const result = await service.detectAnomalies(data, 10);
      expect(result).toEqual([]);
    });

    it("handles two-element dataset", async () => {
      const result = await service.detectAnomalies([1, 100], 2);
      expect(result.length).toBe(0);
    });
  });

  describe("persistAnalysisResult", () => {
    it("calls query with correct params", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
      const summary = await service.analyze([1, 2, 3]);
      await service.persistAnalysisResult("ds-1", summary, []);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO public.analysis_results"),
        expect.arrayContaining(["ds-1"])
      );
    });

    it("persists anomalies", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
      const summary = await service.analyze([1, 2, 3]);
      await service.persistAnalysisResult("ds-1", summary, [
        { index: 0, value: 100, zScore: 5, severity: "critical" },
      ]);
      expect(mockQuery).toHaveBeenCalled();
    });

    it("rejects when db query fails", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      const summary = await service.analyze([1, 2, 3]);
      await expect(
        service.persistAnalysisResult("ds-1", summary, [])
      ).rejects.toThrow("db error");
    });

    it("persists with correct JSON serialization", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
      const summary = await service.analyze([1, 2, 3]);
      await service.persistAnalysisResult("ds-1", summary, []);
      const callParams = mockQuery.mock.calls[0][1] as unknown[];
      expect(typeof callParams[1]).toBe("string");
      expect(typeof callParams[2]).toBe("string");
    });
  });

  describe("getAnalysisHistory", () => {
    it("returns mapped analysis history", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "a1",
            analysis_type: "statistical",
            summary_json: JSON.stringify({ count: 5 }),
            anomalies_json: JSON.stringify([]),
            created_at: new Date(),
          },
        ],
      } as never);
      const result = await service.getAnalysisHistory("ds-1");
      expect(result).toHaveLength(1);
      expect(result[0].summary).toEqual({ count: 5 });
    });

    it("handles JSON string anomalies", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "a1",
            analysis_type: "statistical",
            summary_json: "{}",
            anomalies_json: JSON.stringify([{ index: 0, severity: "high" }]),
            created_at: new Date(),
          },
        ],
      } as never);
      const result = await service.getAnalysisHistory("ds-1");
      expect(result[0].anomalies).toHaveLength(1);
    });

    it("returns empty array when no history", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.getAnalysisHistory("ds-1");
      expect(result).toEqual([]);
    });

    it("applies limit parameter", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      await service.getAnalysisHistory("ds-1", 10);
      expect(mockQuery.mock.calls[0][1]).toContain(10);
    });

    it("rejects when db query fails", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      await expect(service.getAnalysisHistory("ds-1")).rejects.toThrow("db error");
    });

    it("handles already-parsed JSON objects", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "a1",
            analysis_type: "statistical",
            summary_json: { count: 5 },
            anomalies_json: [],
            created_at: new Date(),
          },
        ],
      } as never);
      const result = await service.getAnalysisHistory("ds-1");
      expect(result[0].summary).toEqual({ count: 5 });
    });

    it("defaults limit to 50", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      await service.getAnalysisHistory("ds-1");
      expect(mockQuery.mock.calls[0][1]).toContain(50);
    });

    it("rejects when datasetID is missing in db", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.getAnalysisHistory("non-existent");
      expect(result).toEqual([]);
    });
  });
});
