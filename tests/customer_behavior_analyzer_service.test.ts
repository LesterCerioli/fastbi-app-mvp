import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { CustomerBehaviorAnalyzerService } from "../src/services/customer_behavior_analyzer_service";
import { query } from "../src/services/db";

const service = new CustomerBehaviorAnalyzerService();

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CustomerBehaviorAnalyzerService", () => {
  it("compareTiers identifies best and riskiest tiers", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { tier: "gold", count: 10, avg_ltv: 5000, avg_margin_pct: 30, active_count: 8, high_risk_count: 1, avg_days_since_last_purchase: 30 },
      { tier: "silver", count: 20, avg_ltv: 2000, avg_margin_pct: 25, active_count: 12, high_risk_count: 5, avg_days_since_last_purchase: 60 },
    ]);
    const result = await service.compareTiers("Acme");
    expect(result.best_tier_by_ltv).toBe("gold");
    expect(result.riskiest_tier).toBe("silver");
  });

  it("identifyAtRiskCustomers returns customers with risk scores", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { customer_code: "C1", legal_name: "Alice", tier: "gold", risk_level: "high", days_since: 120, lifetime_value: 5000, region: "North" },
    ]);
    const result = await service.identifyAtRiskCustomers("Acme", 90);
    expect(result.customers).toHaveLength(1);
    expect(result.customers[0].risk_score).toBeGreaterThan(0);
  });

  it("getSegmentBehaviorPatterns returns top segment", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { tier: "gold", region: "North", customer_count: 5, avg_ltv: 8000, avg_margin_pct: 35, active_rate: 0.9 },
    ]);
    const result = await service.getSegmentBehaviorPatterns("Acme");
    expect(result.top_segment.tier).toBe("gold");
  });

  it("getChurnSignals computes probabilities and reasons", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { customer_code: "C1", legal_name: "Bob", tier: "silver", days_since: 200, lifetime_value: 3000 },
    ]);
    const result = await service.getChurnSignals("Acme", 60);
    expect(result.signals[0].churn_probability).toBeGreaterThan(0);
    expect(result.signals[0].reason).toBe("highly_inactive");
  });

  it("compareTiers throws for missing org", async () => {
    mockQuery([]);
    await expect(service.compareTiers("Ghost")).rejects.toThrow("organization not found");
  });

  it("identifyAtRiskCustomers handles empty results", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([]);
    const result = await service.identifyAtRiskCustomers("Acme", 90);
    expect(result.customers).toHaveLength(0);
    expect(result.total_at_risk).toBe(0);
  });

  it("getSegmentBehaviorPatterns handles empty results", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([]);
    const result = await service.getSegmentBehaviorPatterns("Acme");
    expect(result.cells).toHaveLength(0);
  });

  it("getChurnSignals handles empty results", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([]);
    const result = await service.getChurnSignals("Acme", 60);
    expect(result.signals).toHaveLength(0);
    expect(result.estimated_ltv_at_risk).toBe(0);
  });
});
