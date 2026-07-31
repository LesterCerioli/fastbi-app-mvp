import { SyntheticDataGenerator, BindingType } from "../src/services/reports/report_template_preview/synthetic_data_generator";

describe("SyntheticDataGenerator", () => {
  let generator: SyntheticDataGenerator;

  beforeEach(() => {
    generator = new SyntheticDataGenerator("TestOrg", "TestTemplate");
  });

  describe("generateForBinding", () => {
    it("generates currency value", () => {
      const result = generator.generateForBinding("currency");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(1000);
    });

    it("generates percentage value", () => {
      const result = generator.generateForBinding("percentage");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it("generates integer value", () => {
      const result = generator.generateForBinding("integer");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10000);
    });

    it("generates boolean value", () => {
      const result = generator.generateForBinding("boolean");
      expect(typeof result).toBe("boolean");
    });

    it("generates date string", () => {
      const result = generator.generateForBinding("date");
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("generates ratio value", () => {
      const result = generator.generateForBinding("ratio");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    });

    it("generates count value", () => {
      const result = generator.generateForBinding("count");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("generates text for unknown type", () => {
      const result = generator.generateForBinding("text");
      expect(typeof result).toBe("string");
    });
  });

  describe("generateTimeSeries", () => {
    it("returns correct number of points", () => {
      const result = generator.generateTimeSeries(5, "currency");
      expect(result).toHaveLength(5);
    });

    it("each point has date and value", () => {
      const result = generator.generateTimeSeries(3, "currency");
      for (const point of result) {
        expect(point).toHaveProperty("date");
        expect(point).toHaveProperty("value");
      }
    });

    it("dates are sequential", () => {
      const result = generator.generateTimeSeries(3, "currency");
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime()).toBeGreaterThan(
          new Date(result[i - 1].date).getTime()
        );
      }
    });

    it("handles zero points", () => {
      const result = generator.generateTimeSeries(0, "currency");
      expect(result).toEqual([]);
    });

    it("generates integer values for integer type", () => {
      const result = generator.generateTimeSeries(3, "integer");
      for (const point of result) {
        expect(Number.isInteger(point.value)).toBe(true);
      }
    });

    it("generates boolean values for boolean type", () => {
      const result = generator.generateTimeSeries(3, "boolean");
      for (const point of result) {
        expect(typeof point.value).toBe("boolean");
      }
    });

    it("generates same data deterministically", () => {
      const a = new SyntheticDataGenerator("Org", "Tpl");
      const b = new SyntheticDataGenerator("Org", "Tpl");
      expect(a.generateTimeSeries(3, "currency")).toEqual(
        b.generateTimeSeries(3, "currency")
      );
    });

    it("generates different data for different seeds", () => {
      const a = new SyntheticDataGenerator("OrgA", "Tpl");
      const b = new SyntheticDataGenerator("OrgB", "Tpl");
      expect(a.generateTimeSeries(2, "currency")).not.toEqual(
        b.generateTimeSeries(2, "currency")
      );
    });
  });

  describe("generateKPISummaryData", () => {
    it("returns entry for each KPI ID", () => {
      const result = generator.generateKPISummaryData(["kpi1", "kpi2"]);
      expect(result).toHaveLength(2);
    });

    it("each entry has required fields", () => {
      const result = generator.generateKPISummaryData(["kpi1"]);
      const entry = result[0];
      expect(entry).toHaveProperty("code");
      expect(entry).toHaveProperty("value");
      expect(entry).toHaveProperty("target");
      expect(entry).toHaveProperty("pct_of_target");
      expect(entry).toHaveProperty("trend");
    });

    it("trend has 3 values", () => {
      const result = generator.generateKPISummaryData(["kpi1"]);
      expect(result[0].trend).toHaveLength(3);
    });

    it("handles empty KPI array", () => {
      const result = generator.generateKPISummaryData([]);
      expect(result).toEqual([]);
    });

    it("converts KPI IDs to strings", () => {
      const result = generator.generateKPISummaryData([123, 456]);
      expect(result[0].code).toBe("123");
      expect(result[1].code).toBe("456");
    });

    it("pct_of_target is a number", () => {
      const result = generator.generateKPISummaryData(["kpi1"]);
      expect(typeof result[0].pct_of_target).toBe("number");
    });

    it("value is a number", () => {
      const result = generator.generateKPISummaryData(["kpi1"]);
      expect(typeof result[0].value).toBe("number");
    });

    it("target is a number", () => {
      const result = generator.generateKPISummaryData(["kpi1"]);
      expect(typeof result[0].target).toBe("number");
    });
  });

  describe("generateTableRows", () => {
    it("returns correct number of rows", () => {
      const result = generator.generateTableRows(["name", "revenue"], 5);
      expect(result).toHaveLength(5);
    });

    it("each row has the specified columns", () => {
      const result = generator.generateTableRows(["name", "revenue"], 1);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("revenue");
    });

    it("infers currency type from column name", () => {
      const result = generator.generateTableRows(["revenue"], 1);
      expect(typeof result[0].revenue).toBe("number");
    });

    it("infers percentage type", () => {
      const result = generator.generateTableRows(["pct"], 1);
      expect(typeof result[0].pct).toBe("number");
    });

    it("handles empty columns", () => {
      const result = generator.generateTableRows([], 5);
      expect(result).toHaveLength(5);
      for (const row of result) {
        expect(Object.keys(row)).toHaveLength(0);
      }
    });

    it("handles zero rows", () => {
      const result = generator.generateTableRows(["name"], 0);
      expect(result).toEqual([]);
    });

    it("infers date type", () => {
      const result = generator.generateTableRows(["date"], 1);
      expect(typeof result[0].date).toBe("string");
    });

    it("infers count type", () => {
      const result = generator.generateTableRows(["count"], 1);
      expect(typeof result[0].count).toBe("number");
    });
  });
});
