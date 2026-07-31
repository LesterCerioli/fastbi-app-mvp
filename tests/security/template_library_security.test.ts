import { jest } from "@jest/globals";

jest.mock("../../src/services/db", () => ({ query: jest.fn<any>(), queryTx: jest.fn<any>() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { query } from "../../src/services/db";
import { DashboardService, WidgetType } from "../../src/services/dashboard/dashboard_service";

const mockQuery = query as jest.Mock<any>;

describe("Security: Template Library", () => {
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
  });

  describe("Cross-Tenant Template Access (IDOR)", () => {
    it("ResolveTemplateIDByName does not verify org ownership (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "victim-template-id" }] });

      const templateId = await service.ResolveTemplateIDByName("victim-template");
      expect(templateId).toBe("victim-template-id");
    });

    it("GetTemplateByID accepts any id without org scope (informational)", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "victim-tmpl-id", name: "Victim Template", description: "confidential",
          category: "", layout: "{}", widgets: "[]", tags: "{}", thumbnail_url: "",
          is_active: true, created_by: "victim-admin", updated_by: "victim-admin",
          created_at: new Date(), updated_at: new Date(),
        }],
      });

      const tmpl = await service.GetTemplateByID("victim-tmpl-id");
      expect(tmpl.name).toBe("Victim Template");
      expect(tmpl.description).toBe("confidential");
    });

    it("UpdateTemplate modifies without org scope check (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "victim-tmpl-id", name: "Modified By Attacker", description: "",
          category: "", layout: "{}", widgets: "[]", tags: "{}", thumbnail_url: "",
          is_active: true, created_by: "victim-admin", updated_by: "attacker",
          created_at: new Date(), updated_at: new Date(),
        }],
      });

      const tmpl = await service.UpdateTemplate("victim-tmpl-id", {
        name: "Modified By Attacker",
        updated_by: "attacker",
      });
      expect(tmpl.name).toBe("Modified By Attacker");
    });

    it("DeleteTemplate soft-deletes without org scope check (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await expect(
        service.DeleteTemplate("victim-tmpl-id")
      ).resolves.toBeUndefined();
    });
  });

  describe("DoS via Oversized Templates", () => {
    it("CreateTemplate with many widgets succeeds (informational — no limit check)", async () => {
      const manyWidgets = Array.from({ length: 500 }, (_, i) => ({
        widget_type: WidgetType.KPICard,
        title: `Widget ${i}`,
        config: { metric: "revenue" },
      }));

      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tmpl-1", created_at: new Date(), updated_at: new Date() }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "tmpl-1", name: "Heavy Template", description: "", category: "",
          layout: "{}", widgets: JSON.stringify(manyWidgets), tags: "{}", thumbnail_url: "",
          is_active: true, created_by: "user", updated_by: "user",
          created_at: new Date(), updated_at: new Date(),
        }],
      });

      const tmpl = await service.CreateTemplate({
        name: "Heavy Template",
        layout: {},
        widgets: manyWidgets,
        created_by: "user",
      });
      expect(tmpl.id).toBe("tmpl-1");
    });

    it("populateWidgetsFromTemplate processes many widgets from template (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "d-1" }] });
      mockQuery.mockResolvedValueOnce(mockDashboardResult());
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const dash = await service.CreateDashboard({
        organization_name: "acme",
        name: "Heavy Dashboard",
      });
      expect(dash.name).toBe("Heavy Dashboard");
    });
  });

  describe("Template Listing — Org Scope", () => {
    it("ListTemplates returns all templates without org scope (informational)", async () => {
      const mockRow = (id: string, name: string) => ({
        id, name, description: "", category: "", layout: "{}", widgets: "[]", tags: "{}",
        thumbnail_url: "", is_active: true, created_by: "admin", updated_by: "admin",
        created_at: new Date(), updated_at: new Date(),
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "2" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [mockRow("t-1", "Template A"), mockRow("t-2", "Template B")],
      });

      const [templates] = await service.ListTemplates({});
      expect(templates.length).toBe(2);
    });
  });
});

function mockDashboardResult() {
  return {
    rows: [{
      id: "d-1", dashboard_id: "dash-1", organization_id: "org-1",
      template_id: null, name: "Heavy Dashboard", description: "",
      dataset_ids: "[]", layout: "{}", business_context: "", refresh_rate: "",
      is_public: false, is_default: false, is_active: true,
      created_by: "user", updated_by: "user",
      created_at: new Date(), updated_at: new Date(),
    }],
  };
}
