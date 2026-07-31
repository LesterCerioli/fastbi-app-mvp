import { cadenceToExpression, nextRunTime, parseCronField } from "../src/services/reports/report_schedule/cron_evaluator";

describe("cron_evaluator", () => {
  describe("cadenceToExpression", () => {
    it("daily returns 0 0 * * *", () => {
      expect(cadenceToExpression("daily")).toBe("0 0 * * *");
    });

    it("weekly returns 0 0 * * 1", () => {
      expect(cadenceToExpression("weekly")).toBe("0 0 * * 1");
    });

    it("monthly returns 0 0 1 * *", () => {
      expect(cadenceToExpression("monthly")).toBe("0 0 1 * *");
    });

    it("quarterly returns 0 0 1 1,4,7,10 *", () => {
      expect(cadenceToExpression("quarterly")).toBe("0 0 1 1,4,7,10 *");
    });

    it("returns empty for unknown cadence", () => {
      expect(cadenceToExpression("hourly")).toBe("");
    });

    it("returns empty for empty string", () => {
      expect(cadenceToExpression("")).toBe("");
    });

    it("is case insensitive", () => {
      expect(cadenceToExpression("DAILY")).toBe("0 0 * * *");
    });

    it("trims whitespace", () => {
      expect(cadenceToExpression("  weekly  ")).toBe("0 0 * * 1");
    });
  });

  describe("parseCronField", () => {
    it("parses wildcard", () => {
      const result = parseCronField("*", 0, 59);
      expect(result.size).toBe(60);
    });

    it("parses single value", () => {
      const result = parseCronField("5", 0, 23);
      expect(result.has(5)).toBe(true);
      expect(result.size).toBe(1);
    });

    it("parses range", () => {
      const result = parseCronField("1-5", 0, 59);
      expect(result.size).toBe(5);
      expect(result.has(3)).toBe(true);
    });

    it("parses comma-separated values", () => {
      const result = parseCronField("1,3,5", 1, 12);
      expect(result.size).toBe(3);
    });

    it("parses step with wildcard", () => {
      const result = parseCronField("*/15", 0, 59);
      expect(result.has(0)).toBe(true);
      expect(result.has(15)).toBe(true);
      expect(result.has(30)).toBe(true);
      expect(result.has(45)).toBe(true);
    });

    it("throws on invalid step value", () => {
      expect(() => parseCronField("*/0", 0, 59)).toThrow("invalid step value");
    });

    it("throws on out of bounds value", () => {
      expect(() => parseCronField("60", 0, 59)).toThrow("invalid value");
    });

    it("throws on invalid range", () => {
      expect(() => parseCronField("a-b", 0, 59)).toThrow("invalid range");
    });
  });

  describe("nextRunTime", () => {
    it("finds next run for daily cron", () => {
      const from = new Date("2026-01-01T00:00:00Z");
      const result = nextRunTime("0 0 * * *", "UTC", from);
      expect(result.getTime()).toBeGreaterThan(from.getTime());
    });

    it("finds next run for weekly cron", () => {
      const from = new Date("2026-01-01T00:00:00Z");
      const result = nextRunTime("0 0 * * 1", "UTC", from);
      expect(result.getDay()).toBe(1);
    });

    it("finds next run for monthly cron", () => {
      const from = new Date("2026-01-15T00:00:00Z");
      const result = nextRunTime("0 0 1 * *", "UTC", from);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(1);
    });

    it("finds next run for specific hour", () => {
      const from = new Date("2026-01-01T05:00:00Z");
      const result = nextRunTime("0 6 * * *", "UTC", from);
      expect(result.getHours()).toBe(6);
    });

    it("throws on invalid cron expression", () => {
      expect(() => nextRunTime("invalid", "UTC", new Date())).toThrow("cron expression must have 5 fields");
    });

    it("throws on 4-field expression", () => {
      expect(() => nextRunTime("0 0 * *", "UTC", new Date())).toThrow("cron expression must have 5 fields");
    });

    it("throws on empty expression", () => {
      expect(() => nextRunTime("", "UTC", new Date())).toThrow("cron expression must have 5 fields");
    });

    it("handles timezone conversion", () => {
      const from = new Date("2026-01-01T03:00:00Z");
      const result = nextRunTime("0 0 * * *", "America/New_York", from);
      expect(result.getTime()).toBeGreaterThan(from.getTime());
    });
  });
});
