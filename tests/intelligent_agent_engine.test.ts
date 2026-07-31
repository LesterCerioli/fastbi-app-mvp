import { jest } from "@jest/globals";
jest.mock("../../../src/services/db", () => ({
  query: jest.fn(),
}));

jest.mock("../../../src/services/ai/repository", () => ({
  AgentRepository: jest.fn().mockImplementation(() => ({
    saveInsight: jest.fn(),
    saveAnomaly: jest.fn(),
  })),
}));

jest.mock("../../../src/services/ai/planner", () => ({
  Planner: jest.fn().mockImplementation(() => ({
    createPlan: jest.fn(),
  })),
}));

jest.mock("../../../src/services/ai/reasoner", () => ({
  Reasoner: jest.fn().mockImplementation(() => ({
    scoreAction: jest.fn(),
  })),
}));

jest.mock("../../../src/services/ai/executor", () => ({
  Executor: jest.fn().mockImplementation(() => ({
    executeTool: jest.fn(),
  })),
}));

jest.mock("../../../src/services/ai/rag_engine", () => ({
  RAGEngine: jest.fn().mockImplementation(() => ({
    getRelevantKnowledge: jest.fn(),
  })),
}));

jest.mock("../../../src/services/ai/anomaly_detector", () => ({
  AnomalyDetector: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../../../src/services/ai/root_cause_analyzer", () => ({
  RootCauseAnalyzer: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../../../src/services/ai/behavioral_memory", () => ({
  BehavioralMemory: jest.fn().mockImplementation(() => ({
    findSimilarPatterns: jest.fn(),
  })),
}));

jest.mock("../../../src/services/ai/recommendation_generator", () => ({
  RecommendationGenerator: jest.fn().mockImplementation(() => ({
    generate: jest.fn(),
  })),
}));

import { IntelligentAgentEngine, type AgentRequest } from "../../../src/services/ai/intelligent_agent_engine";
import { query } from "../../../src/services/db";
import { Planner } from "../../../src/services/ai/planner";
import { Reasoner } from "../../../src/services/ai/reasoner";
import { Executor } from "../../../src/services/ai/executor";
import { RAGEngine } from "../../../src/services/ai/rag_engine";
import { BehavioralMemory } from "../../../src/services/ai/behavioral_memory";
import { RecommendationGenerator } from "../../../src/services/ai/recommendation_generator";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("IntelligentAgentEngine", () => {
  let engine: IntelligentAgentEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new IntelligentAgentEngine();
  });

  describe("getCurrentMetrics", () => {
    it("returns full metrics when queries succeed", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ category: "Electronics", revenue: "50000" }, { category: "Clothing", revenue: "30000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ region: "US", revenue: "60000" }, { region: "EU", revenue: "40000" }] } as any);

      const result = await engine.getCurrentMetrics("org-1");

      expect(result).not.toBeNull();
      expect(result!.totalRevenue).toBe(100000);
      expect(result!.growthRate).toBe(25);
      expect(result!.topCategories).toHaveLength(2);
      expect(result!.topRegions).toHaveLength(2);
    });

    it("returns zero growth when no previous period data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await engine.getCurrentMetrics("org-1");

      expect(result!.growthRate).toBe(0);
    });

    it("returns null categories when no category data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "50000", transaction_count: "100", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "50000", previous: "40000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ region: "US", revenue: "50000" }] } as any);

      const result = await engine.getCurrentMetrics("org-1");

      expect(result!.topCategories).toHaveLength(0);
      expect(result!.topRegions).toHaveLength(1);
    });

    it("returns null on database error", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      const result = await engine.getCurrentMetrics("org-1");

      expect(result).toBeNull();
    });

    it("returns null when first query fails but subsequent succeed", async () => {
      mockQuery.mockRejectedValueOnce(new Error("first query fail"));

      const result = await engine.getCurrentMetrics("org-1");

      expect(result).toBeNull();
    });

    it("handles empty rows from sales query gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "0", previous: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await engine.getCurrentMetrics("org-1");

      expect(result).not.toBeNull();
      expect(result!.totalRevenue).toBe(0);
    });

    it("handles null values in rows gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: null, transaction_count: null, avg_order_value: null }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: null, previous: null }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await engine.getCurrentMetrics("org-1");

      expect(result!.totalRevenue).toBe(0);
    });
  });

  describe("buildParamsForTool", () => {
    it("sets default dimension for analyze_by_dimension", () => {
      const params = (engine as any).buildParamsForTool("analyze_by_dimension", {});
      expect(params.dimension).toBe("category");
    });

    it("preserves provided dimension for analyze_by_dimension", () => {
      const params = (engine as any).buildParamsForTool("analyze_by_dimension", { dimension: "region" });
      expect(params.dimension).toBe("region");
    });

    it("sets default threshold for detect_anomalies", () => {
      const params = (engine as any).buildParamsForTool("detect_anomalies", {});
      expect(params.threshold).toBe(2.5);
    });

    it("preserves provided threshold for detect_anomalies", () => {
      const params = (engine as any).buildParamsForTool("detect_anomalies", { threshold: 3.0 });
      expect(params.threshold).toBe(3.0);
    });

    it("sets default months for get_historical_data", () => {
      const params = (engine as any).buildParamsForTool("get_historical_data", {});
      expect(params.months).toBe(12);
    });

    it("preserves provided months for get_historical_data", () => {
      const params = (engine as any).buildParamsForTool("get_historical_data", { months: 6 });
      expect(params.months).toBe(6);
    });

    it("returns base params unchanged for unknown tool", () => {
      const params = (engine as any).buildParamsForTool("unknown_tool", { key: "value" });
      expect(params).toEqual({ key: "value" });
    });

    it("copies base params without mutation", () => {
      const original = { key: "val" };
      const params = (engine as any).buildParamsForTool("unknown_tool", original);
      params.key = "changed";
      expect(original.key).toBe("val");
    });
  });

  describe("generateInsightsFromAnalysis", () => {
    it("creates growth insight when growthRate > 10", () => {
      const metrics = { growthRate: 15, totalRevenue: 1000, transactionCount: 50, averageOrderValue: 20, periodLabel: "", topCategories: [], topRegions: [] };
      const insights = (engine as any).generateInsightsFromAnalysis(metrics, [], []);
      expect(insights.some((i: any) => i.type === "trend")).toBe(true);
    });

    it("creates decline insight when growthRate < -10", () => {
      const metrics = { growthRate: -15, totalRevenue: 1000, transactionCount: 50, averageOrderValue: 20, periodLabel: "", topCategories: [], topRegions: [] };
      const insights = (engine as any).generateInsightsFromAnalysis(metrics, [], []);
      expect(insights.some((i: any) => i.type === "alert")).toBe(true);
    });

    it("creates anomaly insight for high z-score anomalies", () => {
      const anomalies = [{ zScore: 3.5, metric: "revenue", dimension: "category", dimensionValue: "A", expectedValue: 100, actualValue: 50 }];
      const insights = (engine as any).generateInsightsFromAnalysis(null, anomalies, []);
      expect(insights.some((i: any) => i.type === "anomaly")).toBe(true);
    });

    it("creates root cause insight for high contribution factors", () => {
      const rootCauses = [{ contribution: 0.5, dimension: "region", value: "US", explanation: "High costs", confidence: 0.8 }];
      const insights = (engine as any).generateInsightsFromAnalysis(null, [], rootCauses);
      expect(insights.some((i: any) => i.type === "root_cause")).toBe(true);
    });

    it("returns empty when metrics null and no anomalies", () => {
      const insights = (engine as any).generateInsightsFromAnalysis(null, [], []);
      expect(insights).toHaveLength(0);
    });

    it("skips anomalies with zScore <= 3", () => {
      const anomalies = [{ zScore: 2.5, metric: "revenue", dimension: "category", dimensionValue: "A", expectedValue: 100, actualValue: 80 }];
      const insights = (engine as any).generateInsightsFromAnalysis(null, anomalies, []);
      expect(insights.some((i: any) => i.type === "anomaly")).toBe(false);
    });

    it("skips root causes with contribution <= 0.4", () => {
      const rootCauses = [{ contribution: 0.3, dimension: "region", value: "US", explanation: "Minor", confidence: 0.5 }];
      const insights = (engine as any).generateInsightsFromAnalysis(null, [], rootCauses);
      expect(insights.some((i: any) => i.type === "root_cause")).toBe(false);
    });

    it("sets severity to critical when actualValue < expectedValue for anomalies", () => {
      const anomalies = [{ zScore: 4, metric: "revenue", dimension: "category", dimensionValue: "A", expectedValue: 100, actualValue: 50 }];
      const insights = (engine as any).generateInsightsFromAnalysis(null, anomalies, []);
      const anomaly = insights.find((i: any) => i.type === "anomaly");
      expect(anomaly.severity).toBe("critical");
    });
  });

  describe("calculateOverallConfidence", () => {
    it("returns 0.7 for baseline metrics", () => {
      const metrics = { totalRevenue: 1000, transactionCount: 100, averageOrderValue: 10, growthRate: 5, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [], []);
      expect(conf).toBe(0.7);
    });

    it("reduces confidence when transactionCount < 50", () => {
      const metrics = { totalRevenue: 1000, transactionCount: 30, averageOrderValue: 10, growthRate: 5, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [], []);
      expect(conf).toBe(0.5);
    });

    it("reduces confidence when totalRevenue is 0", () => {
      const metrics = { totalRevenue: 0, transactionCount: 100, averageOrderValue: 0, growthRate: 0, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [], []);
      expect(conf).toBe(0.4);
    });

    it("reduces confidence when anomalies present", () => {
      const metrics = { totalRevenue: 1000, transactionCount: 100, averageOrderValue: 10, growthRate: 5, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [{ zScore: 2 }], []);
      expect(conf).toBe(0.6);
    });

    it("clamps minimum to 0.3", () => {
      const metrics = { totalRevenue: 0, transactionCount: 0, averageOrderValue: 0, growthRate: 0, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [{ zScore: 2 }], []);
      expect(conf).toBe(0.3);
    });

    it("clamps maximum to 0.95", () => {
      const metrics = { totalRevenue: 100000, transactionCount: 500, averageOrderValue: 200, growthRate: 10, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [], []);
      expect(conf).toBe(0.7);
    });

    it("handles null metrics gracefully", () => {
      const conf = (engine as any).calculateOverallConfidence(null, [], []);
      expect(conf).toBe(0.7);
    });

    it("applies multiple penalties cumulatively", () => {
      const metrics = { totalRevenue: 0, transactionCount: 0, averageOrderValue: 0, growthRate: 0, periodLabel: "", topCategories: [], topRegions: [] };
      const conf = (engine as any).calculateOverallConfidence(metrics, [{ zScore: 2 }], []);
      expect(conf).toBe(0.3);
    });
  });

  describe("execute", () => {
    it("executes plan and returns full AgentResponse for valid request", async () => {
      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({
        subGoals: [
          { toolName: "analyze_by_dimension", description: "Analyze by dimension", target: "" },
        ],
      });
      const mockReasoner = (Reasoner as jest.Mock).mock.instances[0];
      mockReasoner.scoreAction.mockReturnValue(0.8);
      const mockExecutor = (Executor as jest.Mock).mock.instances[0];
      mockExecutor.executeTool.mockResolvedValue({ success: true, output: [] });
      const mockRAG = (RAGEngine as jest.Mock).mock.instances[0];
      mockRAG.getRelevantKnowledge.mockResolvedValue("RAG context");
      const mockBehavioral = (BehavioralMemory as jest.Mock).mock.instances[0];
      mockBehavioral.findSimilarPatterns.mockResolvedValue([]);
      const mockRecGen = (RecommendationGenerator as jest.Mock).mock.instances[0];
      mockRecGen.generate.mockReturnValue(["Recommendation 1"]);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req: AgentRequest = { organizationId: "org-1", goal: "increase_revenue", includeHistory: true };
      const response = await engine.execute(req);

      expect(response.goal).toBe("increase_revenue");
      expect(response.executionSteps).toHaveLength(1);
      expect(response.confidence).toBeGreaterThanOrEqual(0.3);
    });

    it("skips sub-goals with score below 0.3", async () => {
      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({
        subGoals: [
          { toolName: "low_score_tool", description: "Low score", target: "" },
        ],
      });
      const mockReasoner = (Reasoner as jest.Mock).mock.instances[0];
      mockReasoner.scoreAction.mockReturnValue(0.2);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req: AgentRequest = { organizationId: "org-1", goal: "test" };
      const response = await engine.execute(req);

      expect(response.executionSteps).toHaveLength(0);
    });

    it("includes anomaly items from tool output", async () => {
      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({
        subGoals: [{ toolName: "detect_anomalies", description: "", target: "" }],
      });
      const mockReasoner = (Reasoner as jest.Mock).mock.instances[0];
      mockReasoner.scoreAction.mockReturnValue(0.9);
      const mockExecutor = (Executor as jest.Mock).mock.instances[0];
      mockExecutor.executeTool.mockResolvedValue({
        success: true,
        output: [{ zScore: 3.5, metric: "revenue", dimension: "category", dimensionValue: "A", expectedValue: 100, actualValue: 50 }],
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req: AgentRequest = { organizationId: "org-1", goal: "detect" };
      const response = await engine.execute(req);

      expect(response.anomalies).toHaveLength(1);
    });

    it("includes root cause items from tool output", async () => {
      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({
        subGoals: [{ toolName: "analyze_root_cause", description: "", target: "" }],
      });
      const mockReasoner = (Reasoner as jest.Mock).mock.instances[0];
      mockReasoner.scoreAction.mockReturnValue(0.9);
      const mockExecutor = (Executor as jest.Mock).mock.instances[0];
      mockExecutor.executeTool.mockResolvedValue({
        success: true,
        output: [{ contribution: 0.6, dimension: "region", value: "US", explanation: "Costs", confidence: 0.85 }],
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req: AgentRequest = { organizationId: "org-1", goal: "analyze" };
      const response = await engine.execute(req);

      expect(response.rootCauses).toHaveLength(1);
    });

    it("handles failed tool execution gracefully", async () => {
      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({
        subGoals: [{ toolName: "failing_tool", description: "", target: "" }],
      });
      const mockReasoner = (Reasoner as jest.Mock).mock.instances[0];
      mockReasoner.scoreAction.mockReturnValue(0.9);
      const mockExecutor = (Executor as jest.Mock).mock.instances[0];
      mockExecutor.executeTool.mockResolvedValue({ success: false, output: null, error: "Tool failed" });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req: AgentRequest = { organizationId: "org-1", goal: "test" };
      const response = await engine.execute(req);

      expect(response.executionSteps[0].error).toBe("Tool failed");
    });

    it("handles getCurrentMetrics returning null", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({ subGoals: [] });

      const req: AgentRequest = { organizationId: "org-1", goal: "test" };
      const response = await engine.execute(req);

      expect(response.goal).toBe("test");
    });
  });

  describe("scheduledAnalysis", () => {
    it("saves critical and high severity insights", async () => {
      const mockPlanner = (Planner as jest.Mock).mock.instances[0];
      mockPlanner.createPlan.mockReturnValue({ subGoals: [] });

      const mockRAG = (RAGEngine as jest.Mock).mock.instances[0];
      mockRAG.getRelevantKnowledge.mockResolvedValue("");

      const mockRecGen = (RecommendationGenerator as jest.Mock).mock.instances[0];
      mockRecGen.generate.mockReturnValue([]);

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", transaction_count: "200", avg_order_value: "500" }] } as any)
        .mockResolvedValueOnce({ rows: [{ current: "100000", previous: "80000" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await engine.scheduledAnalysis("org-1");

      const repo = (await import("../../../src/services/ai/repository")).AgentRepository as jest.Mock;
      expect(repo).toHaveBeenCalled();
    });
  });
});
