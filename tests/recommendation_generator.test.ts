import { RecommendationGenerator } from "../src/services/ai/recommendation_generator";
import type { CurrentMetrics } from "../src/services/ai/planner";
import type { DetectedAnomaly, RootCause } from "../src/services/ai/reasoner";
import type { BehavioralPattern } from "../src/services/ai/behavioral_memory";

const metrics: CurrentMetrics = {
  totalRevenue: 100000,
  transactionCount: 500,
  averageOrderValue: 200,
  growthRate: 15,
  periodLabel: "Q1 2025",
  topCategories: [],
  topRegions: [],
};

describe("RecommendationGenerator", () => {
  let gen: RecommendationGenerator;

  beforeEach(() => {
    gen = new RecommendationGenerator();
  });

  it("generate returns growth recommendations when metrics are strong", () => {
    const result = gen.generate(metrics, [], [], []);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.includes("growth"))).toBe(true);
  });

  it("generate returns anomaly recommendations when anomalies are critical", () => {
    const anomalies: DetectedAnomaly[] = [
      { metric: "revenue", dimension: "region", dimensionValue: "NA", expectedValue: 100, actualValue: 50, zScore: 4, detectedAt: new Date() },
    ];

    const result = gen.generate(metrics, anomalies, [], []);

    expect(result.some((r) => r.includes("anomaly") || r.includes("drop"))).toBe(true);
  });

  it("generate returns root cause recommendations when root causes have high contribution", () => {
    const rootCauses: RootCause[] = [
      { dimension: "region", value: "NA", contribution: 0.4, confidence: 0.8, explanation: "NA region underperformed" },
    ];

    const result = gen.generate(metrics, [], rootCauses, []);

    expect(result.some((r) => r.includes("contributed"))).toBe(true);
  });

  it("generate returns pattern-based recommendations for highly effective patterns", () => {
    const patterns: BehavioralPattern[] = [
      { id: "p1", triggerSignature: "sig", actionTaken: "increase ad spend", outcomeSuccess: 1, effectiveness: 0.9 },
    ];

    const result = gen.generate(metrics, [], [], patterns);

    expect(result.some((r) => r.includes("success"))).toBe(true);
  });

  it("generate returns no recommendations when all inputs are empty/null", () => {
    const result = gen.generate(null, [], [], []);

    expect(result).toHaveLength(0);
  });

  it("generate deduplicates identical recommendations", () => {
    const rootCauses: RootCause[] = [
      { dimension: "region", value: "NA", contribution: 0.6, confidence: 0.8, explanation: "test" },
    ];

    const result = gen.generate(null, [], rootCauses, []);

    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it("generateOpportunities returns at least monitor recommendation when no opportunities found", () => {
    const result = gen.generateOpportunities(null, [], {});

    expect(result.some((r) => r.includes("Monitor"))).toBe(true);
  });

  it("generateOpportunities returns growth opportunity when growthRate > 10", () => {
    const result = gen.generateOpportunities(metrics, [], {});

    expect(result.some((r) => r.includes("momentum"))).toBe(true);
  });
});
