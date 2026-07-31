import { jest } from "@jest/globals";

jest.mock("../../src/services/db", () => ({ query: jest.fn<any>(), queryTx: jest.fn<any>() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { query } from "../../src/services/db";
import { DashboardService } from "../../src/services/dashboard/dashboard_service";

const mockQuery = query as jest.Mock<any>;

describe("Security: SQL Injection", () => {
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
  });

  describe("Parameterized Queries", () => {
    it("ResolveOrganizationID uses parameterized query (not string interpolation)", async () => {
      const maliciousOrg = "'; DROP TABLE organizations; --";
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.ResolveOrganizationID(maliciousOrg);
      } catch {
        // expected
      }

      const calls = mockQuery.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);

      for (const call of calls) {
        const sql = call[0] as string;
        expect(sql).not.toContain(maliciousOrg);
        expect(sql).toContain("$1");
      }
    });

    it("ResolveTemplateIDByName uses parameterized query", async () => {
      const maliciousName = "'; DELETE FROM dashboard_templates WHERE '1'='1";
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.ResolveTemplateIDByName(maliciousName);
      } catch {
        // expected
      }

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).not.toContain(maliciousName);
      expect(sql).toContain("$1");
    });

    it("ResolveDashboardBySlug uses parameterized query", async () => {
      const maliciousSlug = "'; DROP TABLE dashboards; --";
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.ResolveDashboardBySlug(maliciousSlug);
      } catch {
        // expected
      }

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).not.toContain(maliciousSlug);
      expect(sql).toContain("$1");
    });

    it("ResolveWidgetIDByTitle uses parameterized query", async () => {
      const maliciousTitle = "'; DELETE FROM dashboard_widgets; --";
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.ResolveWidgetIDByTitle("d-1", maliciousTitle);
      } catch {
        // expected
      }

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).not.toContain(maliciousTitle);
      expect(sql).toContain("$1");
    });
  });

  describe("Parameterized Queries — Primary Methods", () => {
    it("ListTemplates uses parameterized query for category filter", async () => {
      const maliciousCat = "'; DROP TABLE dashboard_templates; --";
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.ListTemplates({ category: maliciousCat });

      for (const call of mockQuery.mock.calls) {
        const sql = call[0] as string;
        expect(sql).not.toContain(maliciousCat);
      }
    });

    it("CreateTemplate uses parameterized query", async () => {
      const maliciousName = "'; DROP TABLE dashboard_templates; --";
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t-1", created_at: new Date(), updated_at: new Date() }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "t-1", name: "test", description: "", category: "", layout: "{}", widgets: "[]", tags: "{}", thumbnail_url: "", is_active: true, created_by: null, updated_by: null, created_at: new Date(), updated_at: new Date() }] });

      await service.CreateTemplate({ name: maliciousName, layout: {}, widgets: [] });

      for (const call of mockQuery.mock.calls) {
        const sql = call[0] as string;
        expect(sql).not.toContain(maliciousName);
      }
    });
  });

  describe("Pagination Validation (Informational)", () => {
    it("accepts unbounded limit (documented informational finding)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.ListTemplates({ limit: 999_999_999 });

      const calls = mockQuery.mock.calls;
      const dataCall = calls[calls.length - 1];
      expect(dataCall[0]).toContain("LIMIT");
    });

    it("accepts negative offset (documented informational finding)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.ListTemplates({ offset: -1 });

      const calls = mockQuery.mock.calls;
      const dataCall = calls[calls.length - 1];
      expect(dataCall[0]).toContain("OFFSET");
    });

    it("Uses parameterized limit/offset", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "50" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.ListTemplates({ limit: 10, offset: 5 });

      const dataCall = mockQuery.mock.calls[1];
      const sql = dataCall[0] as string;
      expect(sql).toContain("$");
      expect(sql).not.toContain("10");
      expect(sql).not.toContain("5");
    });
  });

  describe("Dashboard Multi-Statement (Parameterized)", () => {
    it("CreateDashboard uses parameterized org name", async () => {
      const maliciousOrg = "acme'; DROP TABLE dashboards; --";
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await service.CreateDashboard({ organization_name: maliciousOrg, name: "test" });
      } catch {
        // expected
      }

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("$1");
      expect(sql).not.toContain(maliciousOrg);
    });
  });
});
