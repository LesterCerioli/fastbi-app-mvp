import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
}));

import { IndustrialWorkflowEngineService, type WorkflowStructure } from "../src/services/industrial_workflow_engine_service";
import { query } from "../src/services/db";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("IndustrialWorkflowEngineService", () => {
  let service: IndustrialWorkflowEngineService;
  const validStructure: WorkflowStructure = {
    stages: [
      { name: "Stage 1", probability: 100, qualityCheck: true },
      { name: "Stage 2", probability: 80, qualityCheck: true },
    ],
    kpis: ["cycle_time", "throughput"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IndustrialWorkflowEngineService();
  });

  describe("createTemplate", () => {
    it("creates a template and returns parsed structure", async () => {
      const now = new Date();
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "tmpl-1",
          name: "Test Template",
          category: "manufacturing",
          industry_sector: "automotive",
          structure_json: JSON.stringify(validStructure),
          created_by: "user-1",
          created_at: now,
          updated_at: now,
        }],
      } as any);

      const result = await service.createTemplate("Test Template", "manufacturing", validStructure, "user-1", "automotive");

      expect(result.id).toBe("tmpl-1");
      expect(result.category).toBe("manufacturing");
      expect(result.structure.stages).toHaveLength(2);
    });

    it("adds default qualityMetrics and safetyRequirements when missing", async () => {
      const structNoDefaults: WorkflowStructure = {
        stages: [{ name: "A", probability: 100 }, { name: "B", probability: 90 }],
        kpis: ["test_kpi"],
      };
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "tmpl-2",
          name: "No Defaults Template",
          category: "production",
          industry_sector: null,
          structure_json: JSON.stringify(structNoDefaults),
          created_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      } as any);

      const result = await service.createTemplate("No Defaults Template", "production", structNoDefaults);

      expect(result.structure.qualityMetrics).toContain("defect_rate");
      expect(result.structure.safetyRequirements).toContain("osha_compliance");
    });

    it("accepts valid industry sector", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "tmpl-3", name: "Template", category: "manufacturing", industry_sector: "aerospace",
          structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date(),
        }],
      } as any);

      const result = await service.createTemplate("Template", "manufacturing", validStructure, undefined, "aerospace");

      expect(result.industrySector).toBe("aerospace");
    });

    it("sets metadata.created_by_service automatically", async () => {
      const struct: WorkflowStructure = {
        stages: [{ name: "A", probability: 100 }, { name: "B", probability: 90 }],
        kpis: ["kpi1"],
      };
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "tmpl-4", name: "Template", category: "quality_control", industry_sector: null,
          structure_json: JSON.stringify(struct), created_by: null, created_at: new Date(), updated_at: new Date(),
        }],
      } as any);

      await service.createTemplate("Template", "quality_control", struct);

      const insertCall = mockQuery.mock.calls[0][1] as any[];
      const insertedStruct = JSON.parse(insertCall[3]);
      expect(insertedStruct.metadata.created_by_service).toBe("IndustrialWorkflowEngineService");
    });

    it("throws when name is empty", async () => {
      await expect(service.createTemplate("", "manufacturing", validStructure)).rejects.toThrow("template name is required");
    });

    it("throws for invalid category", async () => {
      await expect(service.createTemplate("Test", "invalid_category", validStructure)).rejects.toThrow("invalid category");
    });

    it("throws for invalid industry sector", async () => {
      await expect(service.createTemplate("Test", "manufacturing", validStructure, undefined, "invalid_sector")).rejects.toThrow("invalid industry sector");
    });

    it("throws when structure has fewer than 2 stages", async () => {
      const bad: WorkflowStructure = { stages: [{ name: "Only", probability: 100 }], kpis: ["kpi"] };
      await expect(service.createTemplate("Test", "manufacturing", bad)).rejects.toThrow("workflow must have at least 2 stages");
    });
  });

  describe("generateIndustrialTemplates", () => {
    it("returns the requested number of templates", () => {
      const templates = service.generateIndustrialTemplates(3);

      expect(templates).toHaveLength(3);
    });

    it("returns templates with valid structure properties", () => {
      const templates = service.generateIndustrialTemplates(1);

      expect(templates[0].name).toBe("Assembly Line Production");
      expect(templates[0].structure.stages.length).toBeGreaterThanOrEqual(2);
      expect(templates[0].structure.kpis.length).toBeGreaterThan(0);
    });

    it("returns unique templates for different categories", () => {
      const templates = service.generateIndustrialTemplates(6);

      expect(templates[0].category).toBe("manufacturing");
      expect(templates[1].category).toBe("quality_control");
      expect(templates[2].category).toBe("maintenance");
    });

    it("includes audit and traceability in structure", () => {
      const templates = service.generateIndustrialTemplates(1);

      expect(templates[0].structure.audit).toBeDefined();
      expect(templates[0].structure.traceability).toBeDefined();
    });

    it("returns empty array for count 0", () => {
      const templates = service.generateIndustrialTemplates(0);

      expect(templates).toHaveLength(0);
    });

    it("caps at 6 available templates", () => {
      const templates = service.generateIndustrialTemplates(10);

      expect(templates).toHaveLength(6);
    });

    it("returns all templates when count equals available", () => {
      const templates = service.generateIndustrialTemplates(6);

      expect(templates).toHaveLength(6);
    });

    it("sets empty id for generated templates", () => {
      const templates = service.generateIndustrialTemplates(1);

      expect(templates[0].id).toBe("");
    });
  });

  describe("createWorkflowFromTemplate", () => {
    it("creates workflow from an existing template", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            structure_json: JSON.stringify(validStructure),
            name: "Base Template",
            industry_sector: "automotive",
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "wf-1",
            organization_id: "org-1",
            name: "My Workflow",
            template_id: "tmpl-1",
            structure_json: JSON.stringify(validStructure),
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          }],
        } as any);

      const result = await service.createWorkflowFromTemplate("tmpl-1", "TestOrg", "My Workflow");

      expect(result.id).toBe("wf-1");
      expect(result.status).toBe("active");
    });

    it("applies customization overrides when provided", async () => {
      const customization = { stages: [{ name: "Custom", probability: 95 }], kpis: ["custom_kpi"] };
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            structure_json: JSON.stringify(validStructure),
            name: "Base Template",
            industry_sector: null,
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "wf-2", organization_id: "org-1", name: "Custom WF", template_id: "tmpl-1",
            structure_json: JSON.stringify({ stages: customization.stages, kpis: customization.kpis, customizations: customization }),
            status: "active", created_at: new Date(), updated_at: new Date(),
          }],
        } as any);

      const result = await service.createWorkflowFromTemplate("tmpl-1", "TestOrg", "Custom WF", customization);

      expect(result.structure.customizations).toBeDefined();
    });

    it("uses template name when no name provided", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            structure_json: JSON.stringify(validStructure),
            name: "Base Template",
            industry_sector: null,
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "wf-3", organization_id: "org-1", name: "Base Template", template_id: "tmpl-1",
            structure_json: JSON.stringify(validStructure), status: "active", created_at: new Date(), updated_at: new Date(),
          }],
        } as any);

      const result = await service.createWorkflowFromTemplate("tmpl-1", "TestOrg");

      expect(result.name).toBe("Base Template");
    });

    it("applies quality_metrics customization", async () => {
      const customization = { quality_metrics: ["custom_qm"] };
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            structure_json: JSON.stringify(validStructure), name: "Base", industry_sector: null,
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "wf-4", organization_id: "org-1", name: "Base", template_id: "tmpl-1",
            structure_json: JSON.stringify({ ...validStructure, qualityMetrics: ["custom_qm"], customizations }),
            status: "active", created_at: new Date(), updated_at: new Date(),
          }],
        } as any);

      const result = await service.createWorkflowFromTemplate("tmpl-1", "TestOrg", undefined, customization);

      expect(result.structure.qualityMetrics).toEqual(["custom_qm"]);
    });

    it("throws when template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.createWorkflowFromTemplate("invalid-id", "TestOrg")).rejects.toThrow("industrial workflow template not found");
    });

    it("throws when organization not found", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ structure_json: JSON.stringify(validStructure), name: "Base", industry_sector: null }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.createWorkflowFromTemplate("tmpl-1", "UnknownOrg")).rejects.toThrow("organization");
    });

    it("handles database error on insert", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ structure_json: JSON.stringify(validStructure), name: "Base", industry_sector: null }],
        } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockRejectedValueOnce(new Error("insert failed"));

      await expect(service.createWorkflowFromTemplate("tmpl-1", "TestOrg")).rejects.toThrow("insert failed");
    });

    it("throws for invalid structure_json in template", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ structure_json: "not valid json", name: "Base", industry_sector: null }],
        } as any);

      await expect(service.createWorkflowFromTemplate("tmpl-1", "TestOrg")).rejects.toThrow();
    });
  });

  describe("getTemplatesByCategory", () => {
    it("returns templates for valid category", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t1", name: "Tmpl", category: "manufacturing", industry_sector: null, structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getTemplatesByCategory("manufacturing");

      expect(result).toHaveLength(1);
    });

    it("returns empty array when no templates exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getTemplatesByCategory("manufacturing");

      expect(result).toHaveLength(0);
    });

    it("maps fields correctly including optional industrySector", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t2", name: "Tmpl2", category: "logistics", industry_sector: "automotive", structure_json: JSON.stringify(validStructure), created_by: "u1", created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getTemplatesByCategory("logistics");

      expect(result[0].industrySector).toBe("automotive");
      expect(result[0].createdBy).toBe("u1");
    });

    it("returns multiple templates ordered by created_at DESC", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t1", name: "A", category: "manufacturing", industry_sector: null, structure_json: "{}", created_by: null, created_at: new Date("2024-01-01"), updated_at: new Date() }, { id: "t2", name: "B", category: "manufacturing", industry_sector: null, structure_json: "{}", created_by: null, created_at: new Date("2024-06-01"), updated_at: new Date() }] } as any);

      const result = await service.getTemplatesByCategory("manufacturing");

      expect(result).toHaveLength(2);
    });

    it("throws for invalid category", async () => {
      await expect(service.getTemplatesByCategory("invalid")).rejects.toThrow("invalid category");
    });

    it("throws for empty category string", async () => {
      await expect(service.getTemplatesByCategory("")).rejects.toThrow("invalid category");
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getTemplatesByCategory("manufacturing")).rejects.toThrow("db error");
    });

    it("handles null industry_sector gracefully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t1", name: "Tmpl", category: "manufacturing", industry_sector: null, structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getTemplatesByCategory("manufacturing");

      expect(result[0].industrySector).toBeUndefined();
    });
  });

  describe("getTemplatesByIndustry", () => {
    it("returns templates for valid industry sector", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t1", name: "Tmpl", category: "manufacturing", industry_sector: "automotive", structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getTemplatesByIndustry("automotive");

      expect(result).toHaveLength(1);
    });

    it("returns empty array when no templates match", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getTemplatesByIndustry("aerospace");

      expect(result).toHaveLength(0);
    });

    it("throws for invalid industry sector", async () => {
      await expect(service.getTemplatesByIndustry("invalid_sector")).rejects.toThrow("invalid industry sector");
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getTemplatesByIndustry("automotive")).rejects.toThrow("db error");
    });
  });

  describe("updateTemplate", () => {
    it("updates template name and returns updated record", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "tmpl-1", name: "Updated Name", category: "manufacturing", industry_sector: null,
            structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date(),
          }],
        } as any);

      const result = await service.updateTemplate("tmpl-1", "Updated Name");

      expect(result.name).toBe("Updated Name");
    });

    it("updates category when valid", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "tmpl-1", name: "Test", category: "assembly", industry_sector: null,
            structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date(),
          }],
        } as any);

      const result = await service.updateTemplate("tmpl-1", undefined, "assembly");

      expect(result.category).toBe("assembly");
    });

    it("updates structure when provided and valid", async () => {
      const newStruct: WorkflowStructure = { stages: [{ name: "X", probability: 100 }, { name: "Y", probability: 90 }], kpis: ["new_kpi"] };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: "tmpl-1", name: "Test", category: "manufacturing", industry_sector: null,
            structure_json: JSON.stringify(newStruct), created_by: null, created_at: new Date(), updated_at: new Date(),
          }],
        } as any);

      const result = await service.updateTemplate("tmpl-1", undefined, undefined, newStruct);

      expect(result.structure.kpis).toEqual(["new_kpi"]);
    });

    it("throws when template not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.updateTemplate("invalid-id")).rejects.toThrow("template not found");
    });

    it("throws for invalid category in update", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any);

      await expect(service.updateTemplate("tmpl-1", undefined, "invalid_category")).rejects.toThrow("invalid category");
    });

    it("throws when no updates provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any);

      await expect(service.updateTemplate("tmpl-1")).rejects.toThrow("no updates provided");
    });

    it("throws when invalid structure provided", async () => {
      const badStruct: WorkflowStructure = { stages: [{ name: "Only", probability: 100 }], kpis: [] };
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any);

      await expect(service.updateTemplate("tmpl-1", undefined, undefined, badStruct)).rejects.toThrow("workflow must have at least 2 stages");
    });

    it("propagates database errors", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any);
      mockQuery.mockRejectedValueOnce(new Error("update failed"));

      await expect(service.updateTemplate("tmpl-1", "New Name")).rejects.toThrow("update failed");
    });
  });
});
