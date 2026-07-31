import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { TemplateSectionService } from "../src/services/reports/report_template_section/template_section_service";

const mockQuery = query as jest.Mock;

describe("TemplateSectionService", () => {
  let service: TemplateSectionService;

  beforeEach(() => {
    service = new TemplateSectionService();
    mockQuery.mockReset();
  });

  describe("createSection", () => {
    it("creates a narrative section successfully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ created_at: new Date(), updated_at: new Date() }],
      });
      const result = await service.createSection({
        organizationName: "Org", templateName: "Tpl", type: "narrative",
        orderIndex: 1, config: { prompt_fragment: "Test" }, isOptional: false,
      });
      expect(result.type).toBe("narrative");
      expect(result.orderIndex).toBe(1);
    });

    it("creates a chart section with valid config", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ created_at: new Date(), updated_at: new Date() }],
      });
      const result = await service.createSection({
        organizationName: "Org", templateName: "Tpl", type: "chart",
        orderIndex: 2, config: { chart_type: "bar", metric_query: "SUM(revenue)" },
        isOptional: true,
      });
      expect(result.type).toBe("chart");
    });

    it("creates a kpi_summary section", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ created_at: new Date(), updated_at: new Date() }],
      });
      const result = await service.createSection({
        organizationName: "Org", templateName: "Tpl", type: "kpi_summary",
        orderIndex: 3, config: { kpi_ids: ["kpi1"] }, isOptional: false,
      });
      expect(result.type).toBe("kpi_summary");
    });

    it("preserves visibilityRule when provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ created_at: new Date(), updated_at: new Date() }],
      });
      const result = await service.createSection({
        organizationName: "Org", templateName: "Tpl", type: "narrative",
        orderIndex: 1, config: { prompt_fragment: "Test" }, isOptional: false,
        visibilityRule: { field: "region", operator: "eq", value: "north" },
      });
      expect(result.visibilityRule).toEqual({ field: "region", operator: "eq", value: "north" });
    });

    it("throws when org name is empty", async () => {
      await expect(service.createSection({
        organizationName: "", templateName: "Tpl", type: "narrative",
        orderIndex: 1, config: { prompt_fragment: "Test" }, isOptional: false,
      })).rejects.toThrow("organization_name is required");
    });

    it("throws when template name is empty", async () => {
      await expect(service.createSection({
        organizationName: "Org", templateName: "", type: "narrative",
        orderIndex: 1, config: { prompt_fragment: "Test" }, isOptional: false,
      })).rejects.toThrow("template_name is required");
    });

    it("throws for invalid narrative config", async () => {
      await expect(service.createSection({
        organizationName: "Org", templateName: "Tpl", type: "narrative",
        orderIndex: 1, config: {}, isOptional: false,
      })).rejects.toThrow("narrative section config must include prompt_fragment");
    });

    it("throws for unknown section type", async () => {
      await expect(service.createSection({
        organizationName: "Org", templateName: "Tpl", type: "unknown_type" as any,
        orderIndex: 1, config: {}, isOptional: false,
      })).rejects.toThrow("unknown section type");
    });
  });

  describe("listSections", () => {
    it("returns all sections for a template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: "narrative", order_index: 1, config: "{}",
            is_optional: false, visibility_rule: "{}",
            created_at: new Date(), updated_at: new Date(),
          },
        ],
      });
      const result = await service.listSections("Org", "Tpl");
      expect(result).toHaveLength(1);
    });

    it("returns empty array when no sections", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.listSections("Org", "Tpl");
      expect(result).toEqual([]);
    });

    it("parses JSON config fields", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: "narrative", order_index: 1,
            config: JSON.stringify({ prompt_fragment: "Test" }),
            is_optional: false, visibility_rule: JSON.stringify({ field: "x", operator: "eq", value: "y" }),
            created_at: new Date(), updated_at: new Date(),
          },
        ],
      });
      const result = await service.listSections("Org", "Tpl");
      expect(result[0].config).toEqual({ prompt_fragment: "Test" });
    });

    it("sections ordered by order_index", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { type: "narrative", order_index: 1, config: "{}", is_optional: false, visibility_rule: "{}", created_at: new Date(), updated_at: new Date() },
          { type: "chart", order_index: 2, config: "{}", is_optional: false, visibility_rule: "{}", created_at: new Date(), updated_at: new Date() },
        ],
      });
      const result = await service.listSections("Org", "Tpl");
      expect(result[0].orderIndex).toBe(1);
      expect(result[1].orderIndex).toBe(2);
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.listSections("Unknown", "Tpl")).rejects.toThrow(
        "organization not found"
      );
    });

    it("throws when template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.listSections("Org", "Unknown")).rejects.toThrow(
        "report template not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.listSections("Org", "Tpl")).rejects.toThrow("db error");
    });

    it("handles already-parsed JSON objects", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: "narrative", order_index: 1,
            config: { prompt_fragment: "Test" },
            is_optional: false, visibility_rule: {},
            created_at: new Date(), updated_at: new Date(),
          },
        ],
      });
      const result = await service.listSections("Org", "Tpl");
      expect(result[0].config).toEqual({ prompt_fragment: "Test" });
    });
  });

  describe("getSection", () => {
    it("returns section by order index", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: "narrative", config: "{}", is_optional: false,
            visibility_rule: "{}", created_at: new Date(), updated_at: new Date(),
          },
        ],
      });
      const result = await service.getSection("Org", "Tpl", 1);
      expect(result.orderIndex).toBe(1);
    });

    it("throws when section not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getSection("Org", "Tpl", 99)).rejects.toThrow(
        "section not found at order_index 99"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getSection("Unknown", "Tpl", 1)).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getSection("Org", "Tpl", 1)).rejects.toThrow("db error");
    });
  });

  describe("updateSection", () => {
    it("updates section config", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: "narrative", config: "{}", is_optional: false,
            visibility_rule: "{}", created_at: new Date(), updated_at: new Date(),
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ updated_at: new Date() }],
      });
      const result = await service.updateSection("Org", "Tpl", 1, {
        organizationName: "Org", config: { prompt_fragment: "Updated" },
      });
      expect(result.config).toEqual({ prompt_fragment: "Updated" });
    });

    it("updates isOptional field", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ type: "narrative", config: "{}", is_optional: false, visibility_rule: "{}", created_at: new Date(), updated_at: new Date() }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] });
      const result = await service.updateSection("Org", "Tpl", 1, {
        organizationName: "Org", isOptional: true,
      });
      expect(result.isOptional).toBe(true);
    });

    it("updates visibilityRule", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ type: "narrative", config: "{}", is_optional: false, visibility_rule: "{}", created_at: new Date(), updated_at: new Date() }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] });
      const result = await service.updateSection("Org", "Tpl", 1, {
        organizationName: "Org", visibilityRule: { field: "active", operator: "eq", value: true },
      });
      expect(result.visibilityRule).toEqual({ field: "active", operator: "eq", value: true });
    });

    it("validates config on update", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ type: "chart", config: "{}", is_optional: false, visibility_rule: "{}", created_at: new Date(), updated_at: new Date() }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      const resultPromise = service.updateSection("Org", "Tpl", 1, {
        organizationName: "Org", config: {},
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] });
      await expect(resultPromise).rejects.toThrow();
    });

    it("throws when section not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.updateSection("Org", "Tpl", 99, {
        organizationName: "Org",
      })).rejects.toThrow("section not found at order_index 99");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ type: "narrative", config: "{}", is_optional: false, visibility_rule: "{}", created_at: new Date(), updated_at: new Date() }],
      });
      mockQuery.mockRejectedValueOnce(new Error("update failed"));
      await expect(service.updateSection("Org", "Tpl", 1, {
        organizationName: "Org", config: { prompt_fragment: "X" },
      })).rejects.toThrow("update failed");
    });
  });

  describe("deleteSection", () => {
    it("deletes existing section", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] } as never);
      await service.deleteSection("Org", "Tpl", 1);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it("throws when section not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
      await expect(service.deleteSection("Org", "Tpl", 99)).rejects.toThrow(
        "section not found at order_index 99"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.deleteSection("Unknown", "Tpl", 1)).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.deleteSection("Org", "Tpl", 1)).rejects.toThrow("db error");
    });
  });

  describe("createWidget", () => {
    it("creates widget successfully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "sec1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ created_at: new Date(), updated_at: new Date() }],
      });
      const result = await service.createWidget(1, {
        organizationName: "Org", templateName: "Tpl", widgetType: "chart",
        dataBinding: { kpi_code: "kpi1" }, styleConfig: { color: "blue" },
        orderIndex: 1,
      });
      expect(result.widgetType).toBe("chart");
    });

    it("throws when org name empty", async () => {
      await expect(service.createWidget(1, {
        organizationName: "", templateName: "Tpl", widgetType: "chart",
        dataBinding: {}, styleConfig: {}, orderIndex: 1,
      })).rejects.toThrow("organization_name is required");
    });

    it("throws when template name empty", async () => {
      await expect(service.createWidget(1, {
        organizationName: "Org", templateName: "", widgetType: "chart",
        dataBinding: {}, styleConfig: {}, orderIndex: 1,
      })).rejects.toThrow("template_name is required");
    });

    it("throws when widget type empty", async () => {
      await expect(service.createWidget(1, {
        organizationName: "Org", templateName: "Tpl", widgetType: "",
        dataBinding: {}, styleConfig: {}, orderIndex: 1,
      })).rejects.toThrow("widget_type is required");
    });
  });

  describe("getNarrativeFragments", () => {
    it("returns narrative fragments", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { order_index: 1, config: JSON.stringify({ prompt_fragment: "Test", title: "My Title" }) },
        ],
      });
      const result = await service.getNarrativeFragments("Org", "Tpl");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("My Title");
    });

    it("returns empty array when no narrative sections", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getNarrativeFragments("Org", "Tpl");
      expect(result).toEqual([]);
    });

    it("generates default title when not provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { order_index: 1, config: JSON.stringify({ prompt_fragment: "Test" }) },
        ],
      });
      const result = await service.getNarrativeFragments("Org", "Tpl");
      expect(result[0].title).toBe("Narrative Section 1");
    });

    it("parses JSON config", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tpl1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { order_index: 1, config: { prompt_fragment: "Test" } },
        ],
      });
      const result = await service.getNarrativeFragments("Org", "Tpl");
      expect(result[0].queryHint).toBe("Test");
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getNarrativeFragments("Unknown", "Tpl")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getNarrativeFragments("Org", "Tpl")).rejects.toThrow("db error");
    });
  });
});
