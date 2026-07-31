import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { ExcelExportService, sanitizeSheetName, sanitizeRangeName, columnLetter, orderedKeys, mapChartType, BrandConfig, ReportData } from "../src/services/data_engineering/excel_export_service";
import { query, queryTx } from "../src/services/db";

describe("ExcelExportService", () => {
  let service: ExcelExportService;
  const brandConfig: BrandConfig = { primaryColor: "#000", accentColor: "#fff", tenantName: "Acme", reportTitle: "Report", reportPeriod: "Q1" };
  const reportData: ReportData = { kpiGroups: [], charts: [], rawData: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExcelExportService("https://example.com");
  });

  describe("export", () => {
    it("exports successfully and returns artifact", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: "job-1" }] });
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      const result = await service.export("run-1", "org-1", brandConfig, reportData);
      expect(result.filename).toContain(".xlsx");
      expect(result.worksheets).toContain("Cover");
      expect(result.worksheets).toContain("Raw Data");
    });

    it("throws when report run not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.export("bad-run", "org-1", brandConfig, reportData)).rejects.toThrow("report run not found");
    });
  });

  describe("getArtifact", () => {
    it("returns artifact when found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: "art-1", job_id: "job-1", organization_id: "org-1", file_bytes: Buffer.from(""), file_size_bytes: 100, file_name: "report.xlsx", rendered_at: new Date() }],
      });
      const a = await service.getArtifact("art-1");
      expect(a.filename).toBe("report.xlsx");
    });

    it("throws when artifact not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.getArtifact("missing")).rejects.toThrow("artifact not found");
    });
  });

  describe("deleteArtifact", () => {
    it("deletes artifact successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      await expect(service.deleteArtifact("art-1")).resolves.toBeUndefined();
    });

    it("throws when artifact not found for deletion", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
      await expect(service.deleteArtifact("missing")).rejects.toThrow("artifact not found");
    });
  });

  describe("resolveOrganizationID", () => {
    it("resolves org id", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      const id = await service.resolveOrganizationID("Acme");
      expect(id).toBe("org-1");
    });

    it("throws on empty name", async () => {
      await expect(service.resolveOrganizationID("")).rejects.toThrow("organization_name is required");
    });

    it("throws when org not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.resolveOrganizationID("Ghost")).rejects.toThrow("organization not found");
    });
  });

  describe("getArtifactBytes", () => {
    it("returns artifact bytes when found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: "job-1" }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ file_bytes: Buffer.from("data"), file_name: "r.xlsx", rendered_at: new Date() }] });
      const result = await service.getArtifactBytes("run-1");
      expect(result.fileName).toBe("r.xlsx");
    });

    it("throws when report run not found for bytes", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.getArtifactBytes("bad-run")).rejects.toThrow("report run not found");
    });

    it("throws when artifact not found for run", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ coalesce: "job-1" }] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await expect(service.getArtifactBytes("run-1")).rejects.toThrow("artifact not found for this run");
    });
  });
});

describe("sanitizeSheetName", () => {
  it("trims and replaces invalid characters", () => {
    expect(sanitizeSheetName("  Sheet [1]?: ")).toBe("Sheet (1)  ");
  });

  it("returns Sheet for empty string", () => {
    expect(sanitizeSheetName("")).toBe("Sheet");
  });

  it("truncates to 31 chars", () => {
    expect(sanitizeSheetName("a".repeat(50)).length).toBe(31);
  });
});

describe("sanitizeRangeName", () => {
  it("replaces special characters with underscore", () => {
    expect(sanitizeRangeName("my-range name!")).toBe("my_range_name");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeRangeName("")).toBe("");
  });

  it("prefixes with underscore when starting with digit", () => {
    expect(sanitizeRangeName("1range")).toBe("_1range");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeRangeName("   ")).toBe("");
  });
});

describe("columnLetter", () => {
  it("returns A for index 0", () => {
    expect(columnLetter(0)).toBe("A");
  });

  it("returns Z for index 25", () => {
    expect(columnLetter(25)).toBe("Z");
  });

  it("returns AA for index 26", () => {
    expect(columnLetter(26)).toBe("AA");
  });
});

describe("orderedKeys", () => {
  it("returns sorted keys", () => {
    expect(orderedKeys({ b: 2, a: 1, c: 3 })).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for empty object", () => {
    expect(orderedKeys({})).toEqual([]);
  });
});

describe("mapChartType", () => {
  it("maps bar to bar", () => {
    expect(mapChartType("bar")).toBe("bar");
  });

  it("maps unknown type to column", () => {
    expect(mapChartType("unknown")).toBe("column");
  });

  it("maps bar3d correctly", () => {
    expect(mapChartType("bar3d")).toBe("bar3DClustered");
  });

  it("is case insensitive", () => {
    expect(mapChartType("PIE")).toBe("pie");
  });
});
