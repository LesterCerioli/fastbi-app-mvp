import { RootCauseAnalyzer } from "../src/services/ai/root_cause_analyzer";

const analyzer = new RootCauseAnalyzer();

describe("RootCauseAnalyzer - positive scenarios", () => {
  it("explains decline with significant dimensions", () => {
    const causes = analyzer.explainDecline(1000, 600, [
      { name: "channel", value: "online", before: 500, after: 100 },
      { name: "product", value: "widget", before: 300, after: 200 },
    ]);
    expect(causes.length).toBeGreaterThan(0);
    expect(causes[0].dimension).toBe("channel");
    expect(causes[0].contribution).toBeGreaterThan(0.05);
  });

  it("explains growth with significant dimensions", () => {
    const causes = analyzer.explainGrowth(600, 1000, [
      { name: "channel", value: "online", before: 100, after: 500 },
      { name: "product", value: "widget", before: 200, after: 300 },
    ]);
    expect(causes.length).toBeGreaterThan(0);
    expect(causes[0].dimension).toBe("channel");
  });

  it("sorts causes by contribution descending", () => {
    const causes = analyzer.explainDecline(1000, 400, [
      { name: "channel", value: "online", before: 300, after: 50 },
      { name: "product", value: "widget", before: 300, after: 100 },
      { name: "region", value: "US", before: 200, after: 150 },
    ]);
    for (let i = 1; i < causes.length; i++) {
      expect(causes[i - 1].contribution).toBeGreaterThanOrEqual(causes[i].contribution);
    }
  });

  it("generates explanation with main driver text when contribution > 30%", () => {
    const causes = analyzer.explainDecline(1000, 200, [
      { name: "channel", value: "online", before: 600, after: 50 },
    ]);
    expect(causes.length).toBe(1);
    expect(causes[0].explanation).toContain("main driver");
  });
});

describe("RootCauseAnalyzer - negative scenarios", () => {
  it("returns empty when totalBefore equals totalAfter", () => {
    const causes = analyzer.explainDecline(1000, 1000, [
      { name: "channel", value: "online", before: 500, after: 500 },
    ]);
    expect(causes).toEqual([]);
  });

  it("returns empty when totalBefore is 0", () => {
    const causes = analyzer.explainDecline(0, 100, [
      { name: "channel", value: "online", before: 0, after: 50 },
    ]);
    expect(causes).toEqual([]);
  });

  it("returns empty when total decline is <= 0", () => {
    const causes = analyzer.explainDecline(500, 1000, [
      { name: "channel", value: "online", before: 200, after: 500 },
    ]);
    expect(causes).toEqual([]);
  });

  it("filters out dimensions with contribution <= 0.05", () => {
    const causes = analyzer.explainDecline(1000, 990, [
      { name: "channel", value: "online", before: 10, after: 9 },
    ]);
    expect(causes).toEqual([]);
  });
});
