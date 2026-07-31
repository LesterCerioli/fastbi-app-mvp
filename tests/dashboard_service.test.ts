import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { DashboardService, WidgetType } from "../src/services/dashboard/dashboard_service";
import { query } from "../src/services/db";

describe("DashboardService", () => {
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
  });

  describe("CreateTemplate", () => {
    const validReq = { name: "Sales Dashboard", layout: {}, widgets: [], tags: ["sales"], created_by: "user1" };

    it("creates a template successfully", async () => {
      const mockRow = { id: "tmpl-1", created_at: new Date("2024-01-01"), updated_at: new Date("2024-01-01") };
      (query as jest.Mock).mockResolvedValueOnce({ rows: [mockRow] });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: "tmpl-1", name: "Sales Dashboard", description: "", category: "",
          layout: "{}", widgets: "[]", tags: "{sales}", thumbnail_url: "",
          is_active: true, created_by: "user1", updated_by: "user1",
          created_at: new Date("2024-01-01"), updated_at: new Date("2024-01-01"),
        }],
      });
      const result = await service.CreateTemplate(validReq);
      expect(result.id).toBe("tmpl-1");
      expect(result.name).toBe("Sales Dashboard");
    });

    it("throws when name is empty", async () => {
      await expect(service.CreateTemplate({ ...validReq, name: "" })).rejects.toThrow("name is required");
    });

    it("throws when name is missing", async () => {
      const { name: _, ...noName } = validReq;
      await expect(service.CreateTemplate(noName as any)).rejects.toThrow("name is required");
    });

    it("throws when insert fails with db error", async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error("db error"));
      await expect(service.CreateTemplate(validReq)).rejects.toThrow("db error");
    });
  });

  describe("GetTemplateByID", () => {
    it("returns template when found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: "tmpl-1", name: "Test", description: "desc", category: "cat",
          layout: "{}", widgets: "[]", tags: "{tag1}", thumbnail_url: "",
          is_active: true, created_by: "u1", updated_by: "u1",
          created_at: new Date(), updated_at: new Date(),
        }],
      });
      const t = await service.GetTemplateByID("tmpl-1");
      expect(t.name).toBe("Test");
    });

    it("throws when template not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.GetTemplateByID("nonexistent")).rejects.toThrow("dashboard template not found");
    });

    it("throws when query fails", async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error("connection failed"));
      await expect(service.GetTemplateByID("tmpl-1")).rejects.toThrow("connection failed");
    });
  });

  describe("ResolveOrganizationID", () => {
    it("resolves org id successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      const id = await service.ResolveOrganizationID("Acme");
      expect(id).toBe("org-1");
    });

    it("throws when org name is empty", async () => {
      await expect(service.ResolveOrganizationID("")).rejects.toThrow("organization name is required");
    });

    it("throws when org not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.ResolveOrganizationID("Ghost")).rejects.toThrow("organization not found");
    });
  });

  describe("ResolveTemplateIDByName", () => {
    it("resolves template id", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "t-1" }] });
      const id = await service.ResolveTemplateIDByName("Growth");
      expect(id).toBe("t-1");
    });

    it("throws on empty name", async () => {
      await expect(service.ResolveTemplateIDByName("")).rejects.toThrow("template name is required");
    });

    it("throws when no results", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.ResolveTemplateIDByName("Missing")).rejects.toThrow("dashboard template not found");
    });

    it("throws on ambiguous name", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "t-1" }, { id: "t-2" }] });
      await expect(service.ResolveTemplateIDByName("Duplicate")).rejects.toThrow("ambiguous template name");
    });
  });

  describe("ResolveDashboardBySlug", () => {
    it("resolves dashboard by slug", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "d-1", organization_id: "org-1" }] });
      const r = await service.ResolveDashboardBySlug("my-dash");
      expect(r.id).toBe("d-1");
    });

    it("throws on empty slug", async () => {
      await expect(service.ResolveDashboardBySlug("")).rejects.toThrow("dashboard slug is required");
    });

    it("throws when not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.ResolveDashboardBySlug("ghost")).rejects.toThrow("dashboard not found");
    });
  });

  describe("ResolveWidgetIDByTitle", () => {
    it("resolves widget id by title", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "w-1" }] });
      const id = await service.ResolveWidgetIDByTitle("d-1", "Revenue");
      expect(id).toBe("w-1");
    });

    it("throws on empty title", async () => {
      await expect(service.ResolveWidgetIDByTitle("d-1", "")).rejects.toThrow("widget title is required");
    });

    it("throws when no results", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.ResolveWidgetIDByTitle("d-1", "Ghost")).rejects.toThrow("widget not found");
    });

    it("throws on ambiguous title", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "w-1" }, { id: "w-2" }] });
      await expect(service.ResolveWidgetIDByTitle("d-1", "Dup")).rejects.toThrow("ambiguous widget title");
    });
  });

  describe("AddWidget", () => {
    it("adds a widget successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: 1 }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "w-1", created_at: new Date(), updated_at: new Date() }] });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: "w-1", dashboard_id: "d-1", organization_id: "org-1",
          widget_type: WidgetType.KPICard, title: "KPI", description: "",
          kpi_id: null, config: "{}", position: "{}", size: "{}",
          refresh_interval: 300, is_visible: true, sort_order: 0,
          created_at: new Date(), updated_at: new Date(),
        }],
      });
      const w = await service.AddWidget("d-1", "org-1", {
        organization_name: "org-1", widget_type: WidgetType.KPICard,
      });
      expect(w.widget_type).toBe(WidgetType.KPICard);
    });

    it("throws when widget_type is missing", async () => {
      await expect(service.AddWidget("d-1", "org-1", { organization_name: "org-1" } as any)).rejects.toThrow("widget_type is required");
    });

    it("throws when dashboard not found for ownership", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: 0 }] });
      await expect(service.AddWidget("d-1", "org-1", { organization_name: "org-1", widget_type: WidgetType.KPICard })).rejects.toThrow("dashboard not found");
    });
  });

  describe("DeleteTemplate", () => {
    it("deletes template successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.DeleteTemplate("t-1")).resolves.toBeUndefined();
    });

    it("throws when template not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
      await expect(service.DeleteTemplate("missing")).rejects.toThrow("dashboard template not found");
    });
  });

  describe("UpdateTemplate", () => {
    it("updates template successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: "t-1", name: "Updated", description: "", category: "",
          layout: "{}", widgets: "[]", tags: "{}", thumbnail_url: "",
          is_active: true, created_by: "u1", updated_by: "u1",
          created_at: new Date(), updated_at: new Date(),
        }],
      });
      const t = await service.UpdateTemplate("t-1", { name: "Updated" });
      expect(t.name).toBe("Updated");
    });

    it("throws when template not found for update", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
      await expect(service.UpdateTemplate("missing", { name: "X" })).rejects.toThrow("dashboard template not found");
    });
  });
});
