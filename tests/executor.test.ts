import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("../src/services/ai/anomaly_detector", () => ({
  AnomalyDetector: jest.fn().mockImplementation(() => ({
    detectZScore: jest.fn(),
  })),
}));
jest.mock("../src/services/ai/root_cause_analyzer", () => ({
  RootCauseAnalyzer: jest.fn().mockImplementation(() => ({
    explainDecline: jest.fn(),
  })),
}));
jest.mock("../src/services/ai/behavioral_memory", () => ({
  BehavioralMemory: jest.fn().mockImplementation(() => ({
    findSimilarPatterns: jest.fn(),
  })),
}));

import { Executor } from "../src/services/ai/executor";
import { query } from "../src/services/db";
import { AnomalyDetector } from "../src/services/ai/anomaly_detector";
import { RootCauseAnalyzer } from "../src/services/ai/root_cause_analyzer";
import { BehavioralMemory } from "../src/services/ai/behavioral_memory";

describe("Executor", () => {
  let executor: Executor;
  let anomalyDetector: jest.Mocked<AnomalyDetector>;
  let rootCauseAnalyzer: jest.Mocked<RootCauseAnalyzer>;
  let behavioralMemory: jest.Mocked<BehavioralMemory>;

  beforeEach(() => {
    jest.clearAllMocks();
    anomalyDetector = new (AnomalyDetector as any)() as jest.Mocked<AnomalyDetector>;
    rootCauseAnalyzer = new (RootCauseAnalyzer as any)() as jest.Mocked<RootCauseAnalyzer>;
    behavioralMemory = new (BehavioralMemory as any)() as jest.Mocked<BehavioralMemory>;
    executor = new Executor(anomalyDetector, rootCauseAnalyzer, behavioralMemory);
  });

  describe("executeTool", () => {
    it("executes calculate_growth successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ current: 1000, previous: 800 }] });
      const result = await executor.executeTool("calculate_growth", {}, "org-1");
      expect(result.success).toBe(true);
      expect(result.output.growth_percent).toBeCloseTo(25);
    });

    it("returns error for unknown tool", async () => {
      const result = await executor.executeTool("unknown_tool", {}, "org-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("unknown tool");
    });

    it("executes root_cause_analysis successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ current: 500, previous: 1000 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ category: "A", current: 200, previous: 500 }] });
      (rootCauseAnalyzer.explainDecline as jest.Mock).mockReturnValue([]);
      const result = await executor.executeTool("root_cause_analysis", {}, "org-1");
      expect(result.success).toBe(true);
    });

    it("executes find_similar_patterns successfully", async () => {
      (behavioralMemory.findSimilarPatterns as jest.Mock).mockResolvedValue([]);
      const result = await executor.executeTool("find_similar_patterns", { change_percent: 10 }, "org-1");
      expect(result.success).toBe(true);
    });

    it("executes detect_anomalies successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ day: new Date(), total: 100 }] });
      (anomalyDetector.detectZScore as jest.Mock).mockReturnValue([]);
      const result = await executor.executeTool("detect_anomalies", {}, "org-1");
      expect(result.success).toBe(true);
    });

    it("executes get_current_metrics successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_revenue: 5000, transaction_count: 50, avg_order_value: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ current: 5000, previous: 4000 }] });
      const result = await executor.executeTool("get_current_metrics", {}, "org-1");
      expect(result.success).toBe(true);
      expect(result.output.totalRevenue).toBe(5000);
    });

    it("handles db errors gracefully", async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error("connection lost"));
      const result = await executor.executeTool("calculate_growth", {}, "org-1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("connection lost");
    });

    it("handles exceptions in tool execution", async () => {
      (query as jest.Mock).mockImplementationOnce(() => { throw new Error("unexpected"); });
      const result = await executor.executeTool("calculate_growth", {}, "org-1");
      expect(result.success).toBe(false);
    });

    it("executes get_historical_data", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ month: new Date("2024-01-01"), total: 1000 }] });
      const result = await executor.executeTool("get_historical_data", { months: 6 }, "org-1");
      expect(result.success).toBe(true);
    });

    it("executes seasonality_analysis", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ month: 1, avg_revenue: 500 }] });
      const result = await executor.executeTool("seasonality_analysis", {}, "org-1");
      expect(result.success).toBe(true);
    });

    it("executes generate_recommendations", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total_revenue: 1000, transaction_count: 10, avg_order_value: 100 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ current: 1000, previous: 500 }] });
      const result = await executor.executeTool("generate_recommendations", {}, "org-1");
      expect(result.success).toBe(true);
      expect(result.output.length).toBeGreaterThan(0);
    });
  });
});
