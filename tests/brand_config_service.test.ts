import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { BrandConfigService } from "../src/services/brand_config_service";
import { query } from "../src/services/db";

const service = new BrandConfigService();

function mockQuery(rows: unknown[], rowCount?: number) {
  return jest.mocked(query).mockResolvedValueOnce({ rows, rowCount: rowCount ?? rows.length } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("BrandConfigService", () => {
  it("create inserts brand config", async () => {
    mockQuery([]);
    await expect(service.create("org-1", {
      primary_color: "#000", accent_color: "#fff", tenant_name: "Acme",
      report_title_template: "Report", report_period: "monthly",
    })).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("create accepts optional logo_url", async () => {
    mockQuery([]);
    await service.create("org-1", {
      logo_url: "https://example.com/logo.png", primary_color: "#000",
      accent_color: "#fff", tenant_name: "Acme",
      report_title_template: "", report_period: "",
    });
    expect(query).toHaveBeenCalled();
  });

  it("update updates brand config successfully", async () => {
    mockQuery([], 1);
    await expect(service.update("org-1", {
      primary_color: "#111", accent_color: "#eee", tenant_name: "Acme",
      report_title_template: "", report_period: "",
    })).resolves.toBeUndefined();
  });

  it("getByOrganization returns brand config", async () => {
    mockQuery([{ logo_url: "https://logo", primary_color: "#000", accent_color: "#fff", tenant_name: "Acme", report_title_template: "RPT", report_period: "monthly" }]);
    const result = await service.getByOrganization("org-1");
    expect(result.primary_color).toBe("#000");
    expect(result.logo_url).toBe("https://logo");
  });

  it("create throws on duplicate key", async () => {
    jest.mocked(query).mockRejectedValueOnce(new Error("23505 duplicate key"));
    await expect(service.create("org-1", {
      primary_color: "#000", accent_color: "#fff", tenant_name: "Acme",
      report_title_template: "", report_period: "",
    })).rejects.toThrow("brand config already exists");
  });

  it("update throws when rowCount is 0", async () => {
    mockQuery([], 0);
    await expect(service.update("missing-org", {
      primary_color: "#000", accent_color: "#fff", tenant_name: "Acme",
      report_title_template: "", report_period: "",
    })).rejects.toThrow("brand config not found for this organization");
  });

  it("getByOrganization throws when not found", async () => {
    mockQuery([]);
    await expect(service.getByOrganization("nonexistent")).rejects.toThrow("brand config not found");
  });

  it("resolveOrganizationID throws for empty name", async () => {
    await expect(service.resolveOrganizationID("")).rejects.toThrow("organization_name is required");
  });
});
