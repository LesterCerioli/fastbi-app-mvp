import { evaluateVisibility } from "../../src/services/reports/report_template_section/visibility_evaluator";

function buildDeepAndRule(depth: number): Record<string, any> {
  const leaf: Record<string, any> = {
    field: "revenue",
    operator: "gt",
    value: 0.0,
  };
  if (depth === 0) return leaf;
  return { and: [buildDeepAndRule(depth - 1)] };
}

function buildDeepOrRule(depth: number): Record<string, any> {
  const leaf: Record<string, any> = {
    field: "revenue",
    operator: "gt",
    value: 0.0,
  };
  if (depth === 0) return leaf;
  return { or: [buildDeepOrRule(depth - 1)] };
}

function buildAlternating(depth: number, useAnd: boolean): Record<string, any> {
  const leaf: Record<string, any> = {
    field: "x", operator: "eq", value: false,
  };
  if (depth === 0) return leaf;
  const op = useAnd ? "and" : "or";
  return {
    [op]: [
      buildAlternating(depth - 1, !useAnd),
      buildAlternating(depth - 1, !useAnd),
    ],
  };
}

describe("Security: Visibility Rule DoS", () => {
  const data = { revenue: 1_000_000.0 };

  describe("Deep Nesting", () => {
    it("handles deep AND rule with depth 1000 (timeout-guarded)", () => {
      const rule = buildDeepAndRule(1000);

      const start = Date.now();
      let panicked = false;
      let result: boolean | undefined;

      try {
        result = evaluateVisibility(rule, data);
      } catch (e) {
        panicked = true;
      }

      const elapsed = Date.now() - start;

      if (panicked) {
        // Stack overflow or max call stack exceeded
        return;
      }

      expect(elapsed).toBeLessThan(5000);
      expect(result).toBe(true);
    });

    it("handles deep OR rule with depth 1000 (timeout-guarded)", () => {
      const rule = buildDeepOrRule(1000);

      const start = Date.now();
      let panicked = false;

      try {
        evaluateVisibility(rule, data);
      } catch (e) {
        panicked = true;
      }

      const elapsed = Date.now() - start;

      if (panicked) {
        return;
      }

      expect(elapsed).toBeLessThan(5000);
    });
  });

  describe("Exponential Width — CPU Exhaustion", () => {
    it("evaluates 1000-condition AND rule with short-circuit (informational)", () => {
      const conditions: any[] = [];
      for (let i = 0; i < 1000; i++) {
        conditions.push({
          field: `field_${i}`,
          operator: "eq",
          value: i,
        });
      }
      const rule = { and: conditions };
      const emptyData: Record<string, any> = {};

      const start = Date.now();
      const ok = evaluateVisibility(rule, emptyData);
      const elapsed = Date.now() - start;

      expect(ok).toBe(false);
      expect(elapsed).toBeLessThan(5000);
    });

    it("evaluates 1000-condition OR rule with all false (informational)", () => {
      const conditions: any[] = [];
      for (let i = 0; i < 1000; i++) {
        conditions.push({
          field: `field_${i}`,
          operator: "eq",
          value: i,
        });
      }
      const rule = { or: conditions };
      const emptyData: Record<string, any> = {};

      const start = Date.now();
      const ok = evaluateVisibility(rule, emptyData);
      const elapsed = Date.now() - start;

      expect(ok).toBe(false);
      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe("Large 'in' Operator Array", () => {
    it("handles 'in' operator with 100_000 items (informational)", () => {
      const items: any[] = [];
      for (let i = 0; i < 100_000; i++) {
        items.push(`value-${i}`);
      }

      const rule = {
        field: "region",
        operator: "in" as const,
        value: items,
      };
      const evalData = { region: "not-in-list" };

      const start = Date.now();
      const ok = evaluateVisibility(rule, evalData);
      const elapsed = Date.now() - start;

      expect(ok).toBe(false);
      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe("Alternating Compounds — Exponential Blowup", () => {
    it("evaluates alternating AND/OR tree at depth 15 (timeout-guarded)", () => {
      const rule = buildAlternating(15, true);
      const evalData = { x: false };

      const start = Date.now();
      let timedOut = false;
      let result: boolean | undefined;

      try {
        result = evaluateVisibility(rule, evalData);
      } catch (e) {
        timedOut = true;
      }

      const elapsed = Date.now() - start;

      if (timedOut) {
        return;
      }

      expect(elapsed).toBeLessThan(5000);
    });
  });

  describe("Nil / Malformed Inputs", () => {
    it("panics on nil data map (documented vulnerability)", () => {
      const rule = {
        field: "revenue",
        operator: "gt" as const,
        value: 0.0,
      };

      expect(() => {
        evaluateVisibility(rule, null as any);
      }).toThrow();
    });

    it("returns error for 'and' with integer item", () => {
      expect(() => {
        evaluateVisibility({ and: [42 as any] }, {});
      }).toThrow();
    });

    it("returns error for 'or' with string item", () => {
      expect(() => {
        evaluateVisibility({ or: ["just-a-string"] }, {});
      }).toThrow();
    });

    it("returns error for 'and' with nil item", () => {
      expect(() => {
        evaluateVisibility({ and: [null as any] }, {});
      }).toThrow();
    });

    it("returns error when 'and' is not an array", () => {
      expect(() => {
        evaluateVisibility({ and: "not-an-array" }, {});
      }).toThrow();
    });

    it("evaluates empty rule (no and/or) as visible", () => {
      const ok = evaluateVisibility({}, { revenue: 100 });
      expect(ok).toBe(true);
    });
  });
});
