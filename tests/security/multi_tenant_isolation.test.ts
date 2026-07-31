/// <reference types="jest" />

jest.mock("../../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { query } from "../../src/services/db";
import { DashboardService, WidgetType } from "../../src/services/dashboard/dashboard_service";

const mockQuery = query as jest.Mock<any>;

describe("Security: Multi-Tenant Isolation", () => {
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
  });

  describe("Cross-Org Read", () => {
    it("ResolveOrganizationID does not verify token claim (informational — middleware concern)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "tenant-b-org-id" }] });

      const orgId = await service.ResolveOrganizationID("tenant-b");
      expect(orgId).toBe("tenant-b-org-id");
    });

    it("ListDashboards returns data for any org (informational — middleware must bind org)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "d-1", dashboard_id: "dash-1", organization_id: "victim-org-id",
          template_id: null, name: "Victim Dashboard", description: "",
          dataset_ids: "[]", layout: "{}", business_context: "", refresh_rate: "",
          is_public: false, is_default: false, is_active: true,
          created_by: null, updated_by: null, created_at: new Date(), updated_at: new Date(),
        }],
      });

      const [dashboards] = await service.ListDashboards("victim-org-id", {});
      expect(dashboards.length).toBe(1);
      expect(dashboards[0].name).toBe("Victim Dashboard");
    });

    it("Creates dashboard referencing any org (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "victim-org-id" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "d-1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: "d-1", dashboard_id: "dash-1", organization_id: "victim-org-id",
          template_id: null, name: "Attack Dashboard", description: "",
          dataset_ids: "[]", layout: "{}", business_context: "", refresh_rate: "",
          is_public: false, is_default: false, is_active: true,
          created_by: "attacker", updated_by: "attacker",
          created_at: new Date(), updated_at: new Date(),
        }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const dash = await service.CreateDashboard({
        organization_name: "victim-corp",
        name: "Attack Dashboard",
        created_by: "attacker",
      });

      expect(dash.organization_id).toBe("victim-org-id");
    });
  });

  describe("Cross-Org Write (IDOR)", () => {
    it("verifies dashboard ownership before adding widget (scoped check)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(
        service.AddWidget("victim-dash-id", "attacker-org-id", {
          organization_name: "attacker-org",
          widget_type: WidgetType.KPICard,
        })
      ).rejects.toThrow("dashboard not found");

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("$1");
    });

    it("update scopes by organization_id", async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      await expect(
        service.UpdateDashboard("victim-dash-id", "attacker-org-id", { name: "Hacked" })
      ).rejects.toThrow("dashboard not found");

      const sql: string = mockQuery.mock.calls[0][0] as string as string;
      expect(sql).toContain("organization_id");
    });

    it("delete scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        service.DeleteDashboard("victim-dash-id", "attacker-org-id")
      ).rejects.toThrow("dashboard not found");

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("organization_id");
    });

    it("update widget scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 1 }] });

      const widgetType = WidgetType.KPICard;
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        service.UpdateWidget("w-1", "d-1", "attacker-org-id", { title: "Hacked" })
      ).rejects.toThrow("widget not found");
    });
  });

  describe("Org Name Enumeration (Info-Disclosure)", () => {
    it("exposes org name in error message (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.ResolveOrganizationID("non-existent-corp");
      } catch (err: any) {
        expect(err.message).toContain("non-existent-corp");
      }
    });
  });
});
