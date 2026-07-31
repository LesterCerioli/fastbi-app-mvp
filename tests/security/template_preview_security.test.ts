import { jest } from "@jest/globals";

jest.mock("../../src/services/db", () => ({ query: jest.fn<any>(), queryTx: jest.fn<any>() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { query } from "../../src/services/db";
import { DashboardService } from "../../src/services/dashboard/dashboard_service";

const mockQuery = query as jest.Mock<any>;

describe("Security: Template Preview / Dashboard Access", () => {
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
  });

  describe("Org Isolation — Dashboard Read", () => {
    it("GetDashboardByID scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.GetDashboardByID("d-1", "wrong-org-id")
      ).rejects.toThrow("dashboard not found");

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("organization_id");
      expect(sql).toContain("$1");
    });

    it("UpdateDashboard scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        service.UpdateDashboard("victim-dash-id", "attacker-org-id", { name: "Hacked" })
      ).rejects.toThrow("dashboard not found");

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("organization_id");
    });

    it("DeleteDashboard scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        service.DeleteDashboard("victim-dash-id", "attacker-org-id")
      ).rejects.toThrow("dashboard not found");

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("organization_id");
    });
  });

  describe("Org Isolation — Widget Access", () => {
    it("AddWidget scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(
        service.AddWidget("d-1", "attacker-org-id", {
          organization_name: "attacker",
          widget_type: "kpi_card" as any,
        })
      ).rejects.toThrow("dashboard not found");
    });

    it("UpdateWidget scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 1 }] });
      const { WidgetType } = jest.requireActual("../../src/services/dashboard/dashboard_service") as { WidgetType: any };

      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        service.UpdateWidget("w-1", "d-1", "attacker-org-id", { title: "Hacked" })
      ).rejects.toThrow("widget not found");
    });

    it("ListWidgets scopes by organization_id", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await expect(
        service.ListWidgets("victim-dash-id", "attacker-org-id")
      ).rejects.toThrow("dashboard not found");
    });
  });

  describe("Parameterized Queries (SQL Injection Prevention)", () => {
    it("dashboard lookup uses parameterized query", async () => {
      const maliciousId = "'; DROP TABLE dashboards; --";
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.GetDashboardByID(maliciousId, "org-1");
      } catch {
        // expected
      }

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("$1");
      expect(sql).not.toContain(maliciousId);
    });
  });

  describe("Error Messages (Info Disclosure)", () => {
    it("dashboard not found error does not expose internal IDs", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.GetDashboardByID("nonexistent-id", "org-1");
      } catch (err: any) {
        expect(err.message).not.toContain("org-1");
      }
    });
  });

  describe("Empty/Missing Inputs Rejected", () => {
    it("rejects empty organization name in ResolveOrganizationID", async () => {
      await expect(service.ResolveOrganizationID("")).rejects.toThrow("organization name is required");
    });

    it("rejects empty template name in ResolveTemplateIDByName", async () => {
      await expect(service.ResolveTemplateIDByName("")).rejects.toThrow("template name is required");
    });

    it("rejects empty slug in ResolveDashboardBySlug", async () => {
      await expect(service.ResolveDashboardBySlug("")).rejects.toThrow("dashboard slug is required");
    });

    it("rejects empty widget title in ResolveWidgetIDByTitle", async () => {
      await expect(service.ResolveWidgetIDByTitle("d-1", "")).rejects.toThrow("widget title is required");
    });
  });
});
