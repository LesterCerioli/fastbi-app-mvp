import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { AgentIntelligenceAggregatorService } from "../src/services/ai/agent_intelligence_aggregator_service";
import { query } from "../src/services/db";

const service = new AgentIntelligenceAggregatorService();

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AgentIntelligenceAggregatorService", () => {
  it("getTopEffectivePatterns returns sorted patterns", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { id: "1", trigger_signature: "high_revenue", action_taken: "alert", outcome_success: 1, effectiveness_score: 0.9, last_used_at: new Date() },
      { id: "2", trigger_signature: "low_margin", action_taken: "review", outcome_success: 1, effectiveness_score: 0.7, last_used_at: new Date() },
    ]);
    const result = await service.getTopEffectivePatterns("Acme");
    expect(result.patterns).toHaveLength(2);
    expect(result.patterns[0].effectiveness_score).toBe(0.9);
  });

  it("getInsightEffectivenessRanking computes positive_feedback_rate", async () => {
    mockQuery([
      { insight_type: "revenue", insight_title: "Rev Alert", times_given: 10, positive_feedback: 7, negative_feedback: 1, avg_effectiveness_score: 0.8 },
    ]);
    const result = await service.getInsightEffectivenessRanking();
    expect(result.rankings[0].positive_feedback_rate).toBe(70);
  });

  it("getAnomalySeverityDistribution aggregates buckets and open count", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { severity: "high", total: 5, resolved: 2 },
      { severity: "critical", total: 3, resolved: 0 },
    ]);
    const result = await service.getAnomalySeverityDistribution("Acme");
    expect(result.total_open).toBe(6);
    expect(result.buckets).toHaveLength(2);
  });

  it("getLearningPatternConfidenceDistribution computes overall average", async () => {
    mockQuery([
      { band: "50-75", cnt: 4, avg_conf: 0.6 },
      { band: "75-100", cnt: 6, avg_conf: 0.9 },
    ]);
    const result = await service.getLearningPatternConfidenceDistribution();
    expect(result.overall_avg_confidence).toBeCloseTo(0.78, 2);
  });

  it("getOrganizationHealthScore throws for empty name", async () => {
    await expect(service.getOrganizationHealthScore("")).rejects.toThrow("organization_name is required");
  });

  it("getOrganizationHealthScore throws when history not found", async () => {
    mockQuery([]);
    await expect(service.getOrganizationHealthScore("GhostOrg")).rejects.toThrow("no analysis history found");
  });

  it("getActiveInsightSummary throws for missing org", async () => {
    mockQuery([]);
    await expect(service.getActiveInsightSummary("MissingOrg")).rejects.toThrow("organization not found");
  });

  it("resolveOrg throws for empty name", async () => {
    mockQuery([]);
    await expect(service.getTopEffectivePatterns("")).rejects.toThrow("organization_name is required");
  });
});
