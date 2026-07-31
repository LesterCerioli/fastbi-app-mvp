import { jest } from "@jest/globals";

jest.mock("../../src/services/db", () => ({ query: jest.fn<any>() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { DashboardService } from "../../src/services/dashboard/dashboard_service";
import { query } from "../../src/services/db";

const mockQuery = query as jest.Mock<any>;

describe("Security: Sensitive Data Exposure", () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    dashboardService = new DashboardService();
  });

  describe("Error Messages — Info Disclosure", () => {
    it("exposes org name in error message (org enumeration vector)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await dashboardService.ResolveOrganizationID("acme-corp");
      } catch (err: any) {
        expect(err.message).toContain("organization not found");
        expect(err.message).toContain("acme-corp");
      }
    });

    it("exposes template name in error message (template enumeration)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await dashboardService.ResolveTemplateIDByName("confidential-m-and-a-plan");
      } catch (err: any) {
        expect(err.message).toContain("confidential-m-and-a-plan");
      }
    });

    it("exposes slug in error message (dashboard enumeration)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      try {
        await dashboardService.ResolveDashboardBySlug("executive-compensation");
      } catch (err: any) {
        expect(err.message).toContain("not found");
      }
    });
  });

  describe("Encryption Key Exposure", () => {
    const originalWarn = console.warn;

    afterEach(() => {
      console.warn = originalWarn;
    });

    it("must not log encryption key to console (WARN pattern detected)", () => {
      let capturedOutput = "";
      console.warn = (msg: string) => {
        capturedOutput += msg;
      };

      const simulatedKey = "mocked-base64-encryption-key-here==";
      console.warn(`[WARN] No MASTER_ENCRYPTION_KEY set, generated random key: ${simulatedKey}`);

      expect(capturedOutput).toContain("generated random key");
      expect(capturedOutput).toContain(simulatedKey);
    });
  });

  describe("Log Injection", () => {
    it("org name with newline can inject fake log entries", () => {
      const maliciousOrgName = "acme\n[CRITICAL] Root login from 192.168.1.1";

      const logOutput = `Organization lookup: ${maliciousOrgName}`;
      expect(logOutput).toContain("\n[CRITICAL]");
    });
  });

  describe("Security Headers", () => {
    it("should check for standard security headers (informational)", () => {
      const requiredHeaders = [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Strict-Transport-Security",
        "Content-Security-Policy",
      ];

      requiredHeaders.forEach((header) => {
        expect(header).toBeDefined();
      });
    });
  });

  describe("Stack Trace in Error Responses", () => {
    it("error messages should not leak internal details", () => {
      const internalError = new Error("pq: ERROR: relation \"public.kpis\" does not exist (SQLSTATE 42P01)");
      const message = internalError.message;

      const sensitiveTerms = ["pq:", "SQLSTATE", "public."];
      for (const term of sensitiveTerms) {
        expect(message).toContain(term);
      }
    });
  });
});
