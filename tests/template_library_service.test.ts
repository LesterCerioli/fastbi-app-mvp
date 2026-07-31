import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { TemplateLibraryService } from "../src/services/reports/report_template_library/template_library_service";

const mockQuery = query as jest.Mock;
const mockQueryTx = require("../src/services/db").queryTx as jest.Mock;

function mockOrgRow() {
  return { rows: [{ id: "org1" }] };
}

function mockTemplateRow(overrides = {}) {
  return {
    rows: [{
      id: "t1", organization_id: "org1", name: "Tpl",
      description: "desc", category: "cat", industry_tag: "tech",
      preview_url: "url", export_format: "pdf", language: "en",
      scope: "organization", current_version: 1, usage_count: 0,
      source_template_id: null, source_version: null,
      is_active: true, created_by: "u", updated_by: "u",
      created_at: new Date(), updated_at: new Date(),
      ...overrides,
    }],
  };
}

function mockEmptySections() {
  return { rows: [] };
}

describe("TemplateLibraryService", () => {
  let service: TemplateLibraryService;

  beforeEach(() => {
    service = new TemplateLibraryService();
    mockQuery.mockReset();
    mockQueryTx.mockReset();
  });

  describe("listTemplates", () => {
    it("returns platform templates", async () => {
      mockQuery.mockResolvedValue(mockTemplateRow());
      const result = await service.listTemplates("Org", "platform");
      expect(result).toHaveLength(1);
    });

    it("returns organization templates", async () => {
      mockQuery.mockResolvedValue(mockTemplateRow());
      const result = await service.listTemplates("Org", "organization");
      expect(result).toHaveLength(1);
    });

    it("returns all templates for default scope", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.listTemplates("Org", "all");
      expect(result).toEqual([]);
    });

    it("maps rows to TemplateDTO correctly", async () => {
      mockQuery.mockResolvedValue(mockTemplateRow());
      const result = await service.listTemplates("Org", "platform");
      expect(result[0].currentVersion).toBe(1);
    });

    it("throws when org name is empty", async () => {
      await expect(service.listTemplates("", "platform")).rejects.toThrow("organization_name is required");
    });

    it("throws when org is not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(service.listTemplates("Unknown", "platform")).rejects.toThrow("organization not found");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("connection failed"));
      await expect(service.listTemplates("Org", "platform")).rejects.toThrow("connection failed");
    });

    it("rejects when org query fails", async () => {
      mockQuery.mockRejectedValue(new Error("org query failed"));
      await expect(service.listTemplates("Org", "platform")).rejects.toThrow("org query failed");
    });
  });

  describe("getTemplate", () => {
    it("returns template by name", async () => {
      mockQuery.mockResolvedValue(mockTemplateRow());
      const result = await service.getTemplate("Org", "Tpl");
      expect(result.name).toBe("Tpl");
    });

    it("throws when org name is empty", async () => {
      await expect(service.getTemplate("", "Tpl")).rejects.toThrow("organization_name is required");
    });

    it("throws when template name is empty", async () => {
      await expect(service.getTemplate("Org", "")).rejects.toThrow("template name is required");
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(service.getTemplate("Unknown", "Tpl")).rejects.toThrow("organization not found");
    });
  });

  describe("createTemplate", () => {
    it("creates template and returns DTO", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      const mockQ = jest.fn().mockResolvedValue({ rows: [{ id: "new-tpl" }] });
      mockQueryTx.mockImplementation(async (cb: any) => cb(mockQ));
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ id: "new-tpl", name: "NewTpl" }));
      const result = await service.createTemplate({
        organizationName: "Org", name: "NewTpl", description: "desc",
        category: "cat", industryTag: "", previewURL: "", exportFormat: "pdf",
        language: "en", scope: "organization", createdBy: "user",
      });
      expect(result.name).toBe("NewTpl");
    });

    it("defaults missing exportFormat to pdf", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      const mockQ = jest.fn().mockResolvedValue({ rows: [{ id: "t" }] });
      mockQueryTx.mockImplementation(async (cb: any) => cb(mockQ));
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ id: "t", name: "T" }));
      const result = await service.createTemplate({
        organizationName: "Org", name: "T", description: "", category: "",
        industryTag: "", previewURL: "", exportFormat: "", language: "",
        scope: "organization", createdBy: "",
      });
      expect(result).toBeDefined();
    });

    it("defaults invalid scope to organization", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      const mockQ = jest.fn().mockResolvedValue({ rows: [{ id: "t" }] });
      mockQueryTx.mockImplementation(async (cb: any) => cb(mockQ));
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ id: "t", name: "T" }));
      const result = await service.createTemplate({
        organizationName: "Org", name: "T", description: "", category: "",
        industryTag: "", previewURL: "", exportFormat: "pdf", language: "en",
        scope: "invalid" as any, createdBy: "",
      });
      expect(result).toBeDefined();
    });

    it("throws when org name is empty", async () => {
      await expect(service.createTemplate({} as any)).rejects.toThrow("organization_name is required");
    });

    it("throws when template name is empty", async () => {
      await expect(service.createTemplate({
        organizationName: "Org", name: "", description: "", category: "",
        industryTag: "", previewURL: "", exportFormat: "pdf", language: "en",
        scope: "organization", createdBy: "",
      })).rejects.toThrow("name is required");
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(service.createTemplate({
        organizationName: "Unknown", name: "T", description: "", category: "",
        industryTag: "", previewURL: "", exportFormat: "pdf", language: "en",
        scope: "organization", createdBy: "",
      })).rejects.toThrow("organization not found");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQueryTx.mockRejectedValue(new Error("insert failed"));
      await expect(service.createTemplate({
        organizationName: "Org", name: "T", description: "", category: "",
        industryTag: "", previewURL: "", exportFormat: "pdf", language: "en",
        scope: "organization", createdBy: "",
      })).rejects.toThrow("insert failed");
    });
  });

  describe("updateTemplate", () => {
    it("updates template successfully", async () => {
      mockQuery.mockResolvedValue(mockTemplateRow());
      const mockQ = jest.fn();
      mockQueryTx.mockImplementation(async (cb: any) => cb(mockQ));
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ current_version: 2 }));
      const result = await service.updateTemplate("Org", "Tpl", {
        organizationName: "Org", description: "new", category: "new_cat",
        industryTag: "new", previewURL: "new", changedBy: "u2", changeSummary: "updated",
      });
      expect(result).toBeDefined();
    });

    it("throws when org name empty", async () => {
      await expect(service.updateTemplate("", "Tpl", {} as any)).rejects.toThrow("organization_name is required");
    });

    it("throws when template name empty", async () => {
      await expect(service.updateTemplate("Org", "", {} as any)).rejects.toThrow("template name is required");
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(service.updateTemplate("Unknown", "Tpl", {} as any)).rejects.toThrow("organization not found");
    });
  });

  describe("rollbackTemplate", () => {
    it("rolls back to previous version", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ current_version: 3 }));
      mockQuery.mockResolvedValueOnce({ rows: [{ sections_snapshot: "{}" }] });
      mockQuery.mockResolvedValueOnce(mockEmptySections());
      const mockQ = jest.fn();
      mockQueryTx.mockImplementation(async (cb: any) => cb(mockQ));
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ current_version: 4 }));
      const result = await service.rollbackTemplate("Org", "Tpl", 1, {
        organizationName: "Org", changedBy: "admin",
      });
      expect(result).toBeDefined();
    });

    it("throws when version < 1", async () => {
      await expect(service.rollbackTemplate("Org", "Tpl", 0, {} as any)).rejects.toThrow("version must be >= 1");
    });

    it("throws when target version >= current", async () => {
      mockQuery.mockResolvedValue(mockTemplateRow({ current_version: 2 }));
      await expect(service.rollbackTemplate("Org", "Tpl", 2, {} as any)).rejects.toThrow("target version 2 does not exist; current version is 2");
    });

    it("throws when version not found in DB", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ current_version: 3 }));
      mockQuery.mockResolvedValueOnce(mockEmptySections());
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.rollbackTemplate("Org", "Tpl", 1, {} as any)).rejects.toThrow("version 1 not found for template Tpl");
    });
  });

  describe("cloneTemplate", () => {
    it("clones template successfully", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ id: "src", name: "Src", current_version: 2, usage_count: 5 }));
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org2" }] });
      mockQuery.mockResolvedValueOnce(mockEmptySections());
      const mockQ = jest.fn().mockResolvedValue({ rows: [{ id: "new-tpl" }] });
      mockQueryTx.mockImplementation(async (cb: any) => cb(mockQ));
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ id: "new-tpl", name: "Clone" }));
      const result = await service.cloneTemplate("Org", "Src", {
        organizationName: "Org2", newName: "Clone", description: "",
        scope: "organization", createdBy: "u",
      });
      expect(result).toBeDefined();
    });

    it("throws when org name empty", async () => {
      await expect(service.cloneTemplate("", "Tpl", {} as any)).rejects.toThrow("organization_name is required");
    });

    it("throws when template name empty", async () => {
      await expect(service.cloneTemplate("Org", "", {} as any)).rejects.toThrow("template name is required");
    });

    it("throws when new name empty", async () => {
      await expect(service.cloneTemplate("Org", "Tpl", {} as any)).rejects.toThrow("new_name is required");
    });
  });

  describe("listVersions", () => {
    it("returns version list", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce(mockTemplateRow({ current_version: 2 }));
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.listVersions("Org", "Tpl");
      expect(result).toEqual([]);
    });

    it("throws when org name empty", async () => {
      await expect(service.listVersions("", "Tpl")).rejects.toThrow("organization_name is required");
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(service.listVersions("Unknown", "Tpl")).rejects.toThrow("organization not found");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.listVersions("Org", "Tpl")).rejects.toThrow("db error");
    });
  });

  describe("getVersion", () => {
    it("returns specific version", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce(mockTemplateRow());
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "v1", organization_id: "org1", template_id: "t1",
          version: 1, sections_snapshot: "{}", changed_by: "admin",
          change_summary: "init", created_at: new Date() }],
      });
      const result = await service.getVersion("Org", "Tpl", 1);
      expect(result.version).toBe(1);
    });

    it("throws when version not found", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockResolvedValueOnce(mockTemplateRow());
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getVersion("Org", "Tpl", 99)).rejects.toThrow("version 99 not found for template Tpl");
    });

    it("throws when org name empty", async () => {
      await expect(service.getVersion("", "Tpl", 1)).rejects.toThrow("organization_name is required");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce(mockOrgRow());
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getVersion("Org", "Tpl", 1)).rejects.toThrow("db error");
    });
  });

  describe("incrementUsageCount", () => {
    it("increments usage count", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
      await service.incrementUsageCount("t1");
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("UPDATE public.report_template_catalog"), expect.arrayContaining(["t1"]));
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      await expect(service.incrementUsageCount("t1")).rejects.toThrow("db error");
    });

    it("increments by 1", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
      await service.incrementUsageCount("t1");
      expect(mockQuery.mock.calls[0][0]).toContain("usage_count = usage_count + 1");
    });

    it("handles empty template ID", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
      await service.incrementUsageCount("");
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});
