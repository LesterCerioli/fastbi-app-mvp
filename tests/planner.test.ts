import { Planner, type CurrentMetrics } from "../src/services/ai/planner";

const metrics: CurrentMetrics = {
  totalRevenue: 100000,
  transactionCount: 500,
  averageOrderValue: 200,
  growthRate: 15,
  periodLabel: "Q1 2025",
  topCategories: [],
  topRegions: [],
};

describe("Planner", () => {
  let planner: Planner;

  beforeEach(() => {
    planner = new Planner();
  });

  it("createPlan with diagnose_decline returns decline plan with 6 subGoals", () => {
    const plan = planner.createPlan("diagnose_decline", metrics, {});

    expect(plan.goal).toBe("diagnose_decline");
    expect(plan.subGoals).toHaveLength(6);
    expect(plan.requiredTools).toContain("root_cause_analysis");
  });

  it("createPlan with find_opportunities returns opportunity plan with 5 subGoals", () => {
    const plan = planner.createPlan("find_opportunities", metrics, {});

    expect(plan.goal).toBe("find_opportunities");
    expect(plan.subGoals).toHaveLength(5);
  });

  it("createPlan with forecast returns forecast plan respecting periods_ahead param", () => {
    const plan = planner.createPlan("forecast", metrics, { periods_ahead: 6 });

    expect(plan.goal).toBe("forecast");
    expect(plan.subGoals).toHaveLength(4);
  });

  it("createPlan with compare_periods returns compare plan with 5 subGoals", () => {
    const plan = planner.createPlan("compare_periods", metrics, {});

    expect(plan.goal).toBe("compare_periods");
    expect(plan.subGoals).toHaveLength(5);
  });

  it("createPlan with unknown goal returns general plan", () => {
    const plan = planner.createPlan("unknown_goal" as any, metrics, {});

    expect(plan.goal).toBe("generate_insights");
    expect(plan.subGoals).toHaveLength(2);
  });

  it("createPlan with generate_insights goal returns insights plan with 4 subGoals", () => {
    const plan = planner.createPlan("generate_insights", metrics, {});

    expect(plan.estimatedSteps).toBe(4);
    expect(plan.requiredTools).toContain("detect_anomalies");
  });

  it("createPlan with monitor_anomalies goal returns monitor plan with 4 subGoals", () => {
    const plan = planner.createPlan("monitor_anomalies", metrics, {});

    expect(plan.goal).toBe("monitor_anomalies");
    expect(plan.requiredTools).toContain("generate_alerts");
  });

  it("createPlan with null metrics still creates a valid plan", () => {
    const plan = planner.createPlan("diagnose_decline", null, {});

    expect(plan.subGoals.length).toBeGreaterThan(0);
    expect(plan.estimatedSteps).toBe(6);
  });
});
