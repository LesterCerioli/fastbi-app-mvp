import { evaluateVisibility } from "../src/services/reports/report_template_section/visibility_evaluator";

describe("visibility_evaluator", () => {
  describe("evaluateVisibility - empty rule", () => {
    it("returns true for empty rule", () => {
      expect(evaluateVisibility({}, {})).toBe(true);
    });

    it("returns true for null rule", () => {
      expect(evaluateVisibility({}, { field: "x", value: 1 })).toBe(true);
    });
  });

  describe("evaluateVisibility - simple rules", () => {
    it("evaluates eq operator as true", () => {
      const rule = { field: "region", operator: "eq", value: "north" };
      expect(evaluateVisibility(rule, { region: "north" })).toBe(true);
    });

    it("evaluates eq operator as false", () => {
      const rule = { field: "region", operator: "eq", value: "north" };
      expect(evaluateVisibility(rule, { region: "south" })).toBe(false);
    });

    it("evaluates ne operator as true", () => {
      const rule = { field: "status", operator: "ne", value: "archived" };
      expect(evaluateVisibility(rule, { status: "active" })).toBe(true);
    });

    it("evaluates gt operator", () => {
      const rule = { field: "revenue", operator: "gt", value: 1000 };
      expect(evaluateVisibility(rule, { revenue: 2000 })).toBe(true);
      expect(evaluateVisibility(rule, { revenue: 500 })).toBe(false);
    });

    it("evaluates gte operator", () => {
      const rule = { field: "count", operator: "gte", value: 5 };
      expect(evaluateVisibility(rule, { count: 5 })).toBe(true);
      expect(evaluateVisibility(rule, { count: 4 })).toBe(false);
    });

    it("evaluates lt operator", () => {
      const rule = { field: "age", operator: "lt", value: 18 };
      expect(evaluateVisibility(rule, { age: 15 })).toBe(true);
      expect(evaluateVisibility(rule, { age: 20 })).toBe(false);
    });

    it("evaluates lte operator", () => {
      const rule = { field: "score", operator: "lte", value: 100 };
      expect(evaluateVisibility(rule, { score: 100 })).toBe(true);
      expect(evaluateVisibility(rule, { score: 101 })).toBe(false);
    });

    it("evaluates contains operator", () => {
      const rule = { field: "name", operator: "contains", value: "Inc" };
      expect(evaluateVisibility(rule, { name: "Acme Inc" })).toBe(true);
      expect(evaluateVisibility(rule, { name: "Acme Corp" })).toBe(false);
    });

    it("evaluates in operator", () => {
      const rule = { field: "color", operator: "in", value: ["red", "blue"] };
      expect(evaluateVisibility(rule, { color: "red" })).toBe(true);
      expect(evaluateVisibility(rule, { color: "green" })).toBe(false);
    });

    it("returns false when field is missing in data", () => {
      const rule = { field: "nonexistent", operator: "eq", value: "x" };
      expect(evaluateVisibility(rule, {})).toBe(false);
    });

    it("handles numeric string comparison", () => {
      const rule = { field: "score", operator: "gt", value: "50" };
      expect(evaluateVisibility(rule, { score: "100" })).toBe(true);
    });

    it("deepEqual compares objects", () => {
      const rule = { field: "config", operator: "eq", value: { a: 1 } };
      expect(evaluateVisibility(rule, { config: { a: 1 } })).toBe(true);
      expect(evaluateVisibility(rule, { config: { a: 2 } })).toBe(false);
    });

    it("compares arrays with deepEqual", () => {
      const rule = { field: "tags", operator: "eq", value: [1, 2, 3] };
      expect(evaluateVisibility(rule, { tags: [1, 2, 3] })).toBe(true);
      expect(evaluateVisibility(rule, { tags: [1, 2] })).toBe(false);
    });
  });

  describe("evaluateVisibility - compound rules (and/or)", () => {
    it("evaluates 'and' compound: all true", () => {
      const rule = {
        and: [
          { field: "region", operator: "eq", value: "north" },
          { field: "active", operator: "eq", value: true },
        ],
      };
      expect(evaluateVisibility(rule, { region: "north", active: true })).toBe(true);
    });

    it("evaluates 'and' compound: one false", () => {
      const rule = {
        and: [
          { field: "region", operator: "eq", value: "north" },
          { field: "active", operator: "eq", value: true },
        ],
      };
      expect(evaluateVisibility(rule, { region: "south", active: true })).toBe(false);
    });

    it("evaluates 'or' compound: one true", () => {
      const rule = {
        or: [
          { field: "role", operator: "eq", value: "admin" },
          { field: "role", operator: "eq", value: "manager" },
        ],
      };
      expect(evaluateVisibility(rule, { role: "admin" })).toBe(true);
    });

    it("evaluates 'or' compound: all false", () => {
      const rule = {
        or: [
          { field: "role", operator: "eq", value: "admin" },
          { field: "role", operator: "eq", value: "manager" },
        ],
      };
      expect(evaluateVisibility(rule, { role: "user" })).toBe(false);
    });

    it("throws when 'and' is not an array", () => {
      const rule = { and: "not-array" };
      expect(() => evaluateVisibility(rule, {})).toThrow("visibility_rule: 'and' must be an array");
    });

    it("throws when 'or' item is not an object", () => {
      const rule = { or: ["string"] };
      expect(() => evaluateVisibility(rule, {})).toThrow("visibility_rule: 'or' item 0 is not an object");
    });

    it("returns true for empty 'and' array", () => {
      const rule = { and: [] };
      expect(evaluateVisibility(rule, {})).toBe(true);
    });

    it("returns false for empty 'or' array", () => {
      const rule = { or: [] };
      expect(evaluateVisibility(rule, {})).toBe(false);
    });

    it("supports nested compound rules", () => {
      const rule = {
        and: [
          { field: "region", operator: "eq", value: "north" },
          {
            or: [
              { field: "tier", operator: "eq", value: "premium" },
              { field: "revenue", operator: "gt", value: 10000 },
            ],
          },
        ],
      };
      expect(evaluateVisibility(rule, { region: "north", tier: "premium" })).toBe(true);
      expect(evaluateVisibility(rule, { region: "north", tier: "standard", revenue: 5000 })).toBe(false);
    });
  });

  describe("evaluateVisibility - error cases", () => {
    it("throws when field is missing", () => {
      const rule = { operator: "eq", value: "x" };
      expect(() => evaluateVisibility(rule, {})).toThrow("visibility_rule: missing or invalid 'field'");
    });

    it("throws when field is empty", () => {
      const rule = { field: "", operator: "eq", value: "x" };
      expect(() => evaluateVisibility(rule, {})).toThrow("visibility_rule: missing or invalid 'field'");
    });

    it("throws when operator is missing", () => {
      const rule = { field: "x", value: "y" };
      expect(() => evaluateVisibility(rule, { x: "y" })).toThrow("visibility_rule: missing or invalid 'operator'");
    });

    it("throws when value is missing", () => {
      const rule = { field: "x", operator: "eq" };
      expect(() => evaluateVisibility(rule, {})).toThrow("visibility_rule: missing 'value'");
    });

    it("throws for unknown operator", () => {
      const rule = { field: "x", operator: "unknown", value: 1 };
      expect(() => evaluateVisibility(rule, { x: 1 })).toThrow("visibility_rule: unknown operator 'unknown'");
    });

    it("throws contains requires string data value", () => {
      const rule = { field: "x", operator: "contains", value: "test" };
      expect(() => evaluateVisibility(rule, { x: 42 })).toThrow("visibility_rule: 'contains' requires a string field value");
    });

    it("throws contains requires string rule value", () => {
      const rule = { field: "x", operator: "contains", value: 42 };
      expect(() => evaluateVisibility(rule, { x: "test" })).toThrow("visibility_rule: 'contains' requires a string rule value");
    });

    it("throws 'in' requires array value", () => {
      const rule = { field: "x", operator: "in", value: "not-array" };
      expect(() => evaluateVisibility(rule, { x: "test" })).toThrow("visibility_rule: 'in' value must be an array");
    });

    it("throws for non-numeric comparison", () => {
      const rule = { field: "x", operator: "gt", value: 5 };
      expect(() => evaluateVisibility(rule, { x: "abc" })).toThrow("visibility_rule: cannot compare non-numeric value");
    });
  });
});
