import { Reasoner, type CurrentMetrics } from "../src/services/ai/reasoner";

const baseMetrics: CurrentMetrics = {
  totalRevenue: 100000,
  transactionCount: 500,
  averageOrderValue: 200,
  growthRate: 15,
  periodLabel: "Q1 2025",
  topCategories: [],
  topRegions: [],
};

describe("Reasoner", () => {
  let reasoner: Reasoner;

  beforeEach(() => {
    reasoner = new Reasoner();
  });

  it("scoreAction returns high score for detect_anomalies with critical anomalies", () => {
    const score = reasoner.scoreAction("detect_anomalies", baseMetrics, [
      { metric: "revenue", dimension: "region", dimensionValue: "NA", expectedValue: 100, actualValue: 50, zScore: 4, detectedAt: new Date() },
    ], []);

    expect(score).toBe(0.95);
  });

  it("scoreAction returns high score for diagnose_decline when growthRate is very negative", () => {
    const declining: CurrentMetrics = { ...baseMetrics, growthRate: -20 };
    const score = reasoner.scoreAction("diagnose_decline", declining, [], []);

    expect(score).toBeGreaterThanOrEqual(0.95);
  });

  it("scoreAction returns 0.9 for find_opportunities when growthRate > 10", () => {
    const score = reasoner.scoreAction("find_opportunities", baseMetrics, [], []);

    expect(score).toBe(0.9);
  });

  it("scoreActions returns sorted array of ActionScore", () => {
    const actions = reasoner.scoreActions(["detect_anomalies", "find_opportunities"], baseMetrics, [], []);

    expect(actions.length).toBe(2);
    expect(actions[0].score).toBeGreaterThanOrEqual(actions[1].score);
    expect(actions[0].reason).toBeDefined();
  });

  it("scoreAction returns 0.5 for unknown action", () => {
    const score = reasoner.scoreAction("unknown_action" as any, baseMetrics, [], []);

    expect(score).toBe(0.5);
  });

  it("scoreAction for detect_anomalies returns 0.5 when metrics is null", () => {
    const score = reasoner.scoreAction("detect_anomalies", null, [], []);

    expect(score).toBe(0.5);
  });

  it("scoreAction for generate_forecast returns 0.5 when growthRate is low", () => {
    const stable: CurrentMetrics = { ...baseMetrics, growthRate: 2 };
    const score = reasoner.scoreAction("generate_forecast", stable, [], []);

    expect(score).toBe(0.5);
  });

  it("scoreAction for compare_periods always returns 0.6", () => {
    const score = reasoner.scoreAction("compare_periods", null, [], []);

    expect(score).toBe(0.6);
  });
});
