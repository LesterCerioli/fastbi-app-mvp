import { TextComposer, NarrativeSectionRequest } from "../src/services/reports/report_narrative/text_composer";
import { RetrievedContext } from "../src/services/reports/report_narrative/context_retriever";

function makeContext(overrides: Partial<RetrievedContext> = {}): RetrievedContext {
  return {
    kbDocuments: [],
    numericData: {},
    period: "last_30_days",
    ...overrides,
  };
}

describe("TextComposer", () => {
  let composer: TextComposer;

  beforeEach(() => {
    composer = new TextComposer();
  });

  describe("compose - revenue section", () => {
    it("composes revenue narrative with positive growth", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Revenue Analysis", sectionType: "revenue",
        queryHint: "revenue data", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("100000.00");
      expect(result.text).toContain("increase");
      expect(result.claims.length).toBeGreaterThan(0);
    });

    it("composes revenue narrative with negative growth", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Revenue", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 50000,
          "sales_records:prev_total_revenue": 100000,
          "sales_records:transaction_count": 300,
          "sales_records:avg_order_value": 166.67,
          "sales_records:growth_pct": -50,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("50.00%");
      expect(result.text).toContain("decline");
    });

    it("includes top category data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Revenue", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
          "sales_records:category:Electronics:revenue": 40000,
          "sales_records:category:Clothing:revenue": 30000,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Electronics");
      expect(result.text).toContain("Clothing");
    });

    it("skips categories when none present", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Revenue", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).not.toContain("Top revenue categories");
    });

    it("handles zero revenue gracefully", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Rev", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 0,
          "sales_records:prev_total_revenue": 0,
          "sales_records:transaction_count": 0,
          "sales_records:avg_order_value": 0,
          "sales_records:growth_pct": 0,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("0.00");
    });

    it("includes KB snippets when docs provided", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Revenue", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
        },
        kbDocuments: [
          { sourceRef: "doc1", content: "Market conditions improved this quarter.", score: 0.8 },
        ],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Market conditions");
    });

    it("generates claims from numeric data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Rev", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.claims.length).toBeGreaterThanOrEqual(1);
    });

    it("handles missing numeric fields by defaulting to 0", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Revenue", sectionType: "revenue",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({ numericData: {} });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("0.00");
    });
  });

  describe("compose - KPI section", () => {
    it("composes KPI narrative with data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI Overview", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "kpis:revenue_growth:actual_value": 15.5,
          "kpis:revenue_growth:target_value": 10,
          "kpis:revenue_growth:variance_pct": 55,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("above target");
    });

    it("reports below target KPI", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "kpis:profit_margin:actual_value": 5,
          "kpis:profit_margin:target_value": 15,
          "kpis:profit_margin:variance_pct": -66.67,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("below target");
    });

    it("handles missing KPI data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({ numericData: {} });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("No KPI data was available");
    });

    it("reports on target KPI", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "kpis:market_share:actual_value": 25,
          "kpis:market_share:target_value": 25,
          "kpis:market_share:variance_pct": 0,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("on target");
    });

    it("handles missing target/variance defaults", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "kpis:test:actual_value": 100,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("on target");
    });

    it("extracts claims for KPI data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "kpis:rev:actual_value": 15,
          "kpis:rev:target_value": 10,
          "kpis:rev:variance_pct": 50,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.claims.length).toBeGreaterThan(0);
    });

    it("includes KB snippets for KPI section", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "kpis:a:actual_value": 1, "kpis:a:target_value": 1, "kpis:a:variance_pct": 0 },
        kbDocuments: [{ sourceRef: "kb1", content: "KPI context note", score: 0.9 }],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("KPI context note");
    });

    it("handles multiple KPI entries", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Multi KPI", sectionType: "kpi",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "kpis:a:actual_value": 10, "kpis:a:target_value": 10, "kpis:a:variance_pct": 0,
          "kpis:b:actual_value": 20, "kpis:b:target_value": 15, "kpis:b:variance_pct": 33.33,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("KPI a");
      expect(result.text).toContain("KPI b");
    });
  });

  describe("compose - trend section", () => {
    it("composes trend narrative with upward direction", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:growth_pct": 15,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("upward");
    });

    it("composes trend narrative with downward direction", () => {
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 50000,
          "sales_records:growth_pct": -15,
        },
      });
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("downward");
    });

    it("reports stable trend for small changes", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 1000,
          "sales_records:growth_pct": 2,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("stable");
    });

    it("extracts claims from trend narrative", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:growth_pct": 10,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.claims.length).toBeGreaterThan(0);
    });

    it("handles missing growth_pct defaulting to 0", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({ numericData: {} });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("stable");
    });

    it("includes KB snippets for trend", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 1000, "sales_records:growth_pct": 5 },
        kbDocuments: [{ sourceRef: "d1", content: "Market is growing", score: 0.9 }],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Market is growing");
    });

    it("handles zero values", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Trends", sectionType: "trend",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 0, "sales_records:growth_pct": 0 },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("0.00");
    });
  });

  describe("compose - anomaly section", () => {
    it("composes anomaly narrative with detected anomalies", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "agent_anomalies:sales:expected": 1000,
          "agent_anomalies:sales:actual": 5000,
          "agent_anomalies:sales:zscore": 4.5,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("critical");
      expect(result.text).toContain("anomaly");
    });

    it("reports no anomalies when none detected", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({ numericData: {} });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("No active anomalies");
    });

    it("classifies moderate z-score", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "agent_anomalies:metric1:expected": 100,
          "agent_anomalies:metric1:actual": 120,
          "agent_anomalies:metric1:zscore": 1.5,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("moderate");
    });

    it("classifies high z-score", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "agent_anomalies:metric1:expected": 100,
          "agent_anomalies:metric1:actual": 300,
          "agent_anomalies:metric1:zscore": 2.5,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("high");
    });

    it("extracts claims from anomaly narrative", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "agent_anomalies:m1:expected": 100,
          "agent_anomalies:m1:actual": 500,
          "agent_anomalies:m1:zscore": 3.5,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.claims.length).toBeGreaterThan(0);
    });

    it("handles multiple anomaly entries", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "agent_anomalies:a:expected": 50, "agent_anomalies:a:actual": 200, "agent_anomalies:a:zscore": 4,
          "agent_anomalies:b:expected": 30, "agent_anomalies:b:actual": 90, "agent_anomalies:b:zscore": 2.5,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Metric 'a'");
      expect(result.text).toContain("Metric 'b'");
    });

    it("includes KB snippets for anomaly section", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Anomalies", sectionType: "anomaly",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "agent_anomalies:m1:expected": 10, "agent_anomalies:m1:actual": 100, "agent_anomalies:m1:zscore": 5 },
        kbDocuments: [{ sourceRef: "kb1", content: "Anomaly context", score: 0.9 }],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Anomaly context");
    });
  });

  describe("compose - executive section", () => {
    it("composes executive summary with growth data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Executive", sectionType: "executive",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 200000,
          "sales_records:prev_total_revenue": 150000,
          "sales_records:transaction_count": 1000,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 33.33,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Executive Summary");
      expect(result.text).toContain("33.33%");
    });

    it("includes KPI highlights in executive summary", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Executive", sectionType: "executive",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 200000,
          "sales_records:prev_total_revenue": 150000,
          "sales_records:transaction_count": 1000,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 33.33,
          "kpis:profit:actual_value": 50000,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("profit");
    });

    it("handles missing category data in executive", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Executive", sectionType: "executive",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).not.toContain("Top revenue categories");
    });

    it("includes KB snippets (up to 3 docs)", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Executive", sectionType: "executive",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 100000,
          "sales_records:prev_total_revenue": 80000,
          "sales_records:transaction_count": 500,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": 25,
        },
        kbDocuments: [
          { sourceRef: "d1", content: "Doc1", score: 0.9 },
          { sourceRef: "d2", content: "Doc2", score: 0.8 },
          { sourceRef: "d3", content: "Doc3", score: 0.7 },
          { sourceRef: "d4", content: "Doc4", score: 0.6 },
        ],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Doc1");
      expect(result.text).toContain("Doc3");
    });

    it("handles decline in executive summary", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Executive", sectionType: "executive",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 60000,
          "sales_records:prev_total_revenue": 100000,
          "sales_records:transaction_count": 300,
          "sales_records:avg_order_value": 200,
          "sales_records:growth_pct": -40,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("decline");
    });

    it("handles zero data", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Executive", sectionType: "executive",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({ numericData: {} });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("0.00");
    });
  });

  describe("compose - default summary section", () => {
    it("composes summary for unknown section types", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: {
          "sales_records:total_revenue": 50000,
          "sales_records:growth_pct": 10,
        },
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Analysis summary");
    });

    it("handles missing total_revenue in summary", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({ numericData: {} });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("0.00");
    });

    it("includes KB snippets in summary", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 1000, "sales_records:growth_pct": 5 },
        kbDocuments: [{ sourceRef: "d1", content: "Summary context", score: 0.9 }],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("Summary context");
    });

    it("extracts claims from summary", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 50000, "sales_records:growth_pct": 10 },
      });
      const result = composer.compose(req, ctx);
      expect(result.claims.length).toBeGreaterThan(0);
    });

    it("handles period in context", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 100, "sales_records:growth_pct": 0 },
        period: "last_7_days",
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("last_7_days");
    });

    it("skips KB docs with low score", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 100, "sales_records:growth_pct": 0 },
        kbDocuments: [{ sourceRef: "d1", content: "Low score doc", score: 0.05 }],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).not.toContain("Low score doc");
    });

    it("truncates long KB snippets", () => {
      const req: NarrativeSectionRequest = {
        sectionID: "s1", title: "Custom", sectionType: "custom_section",
        queryHint: "", topK: 5, lookbackDays: 30,
      };
      const longContent = "A".repeat(200);
      const ctx = makeContext({
        numericData: { "sales_records:total_revenue": 100, "sales_records:growth_pct": 0 },
        kbDocuments: [{ sourceRef: "d1", content: longContent, score: 0.9 }],
      });
      const result = composer.compose(req, ctx);
      expect(result.text).toContain("...");
    });
  });
});
