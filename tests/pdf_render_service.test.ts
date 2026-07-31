import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { PDFRenderService, type BrandConfig, type ReportData, type NarrativeSection } from "../src/services/data_engineering/pdf_render_service";

const mockQuery = query as jest.MockedFunction<typeof query>;

const brand: BrandConfig = {
  primaryColor: "#1a73e8",
  accentColor: "#34a853",
  reportTitle: "Monthly Report",
  tenantName: "Acme Corp",
  reportPeriod: "2025-01",
  generatedDate: "2025-02-01",
};

const reportData: ReportData = {
  kpiGroups: [],
  charts: [],
};

const sections: NarrativeSection[] = [];

describe("PDFRenderService", () => {
  let service: PDFRenderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PDFRenderService();
    process.env.BASE_URL = "http://test.com";
  });

  it("render returns PDFArtifact when report run and insert succeed", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ job_id: "job-1" }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ id: "art-1" }], rowCount: 1 } as any);

    const result = await service.render(
      "run-1", "org-1", brand, reportData, sections,
    );

    expect(result.filename).toMatch(/^report_run-1/);
    expect(result.url).toContain("/api/v1/reports/runs/run-1/artifacts/pdf/download");
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("getArtifactBytes returns file bytes when artifact exists and not expired", async () => {
    const future = new Date(Date.now() - 1000);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ job_id: "job-1" }], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [{
          file_bytes: Buffer.from("test"),
          file_name: "report.pdf",
          rendered_at: new Date(),
        }],
        rowCount: 1,
      } as any);

    const result = await service.getArtifactBytes("run-1");

    expect(result.fileBytes).toBeDefined();
    expect(result.fileName).toBe("report.pdf");
  });

  it("getArtifactInfo returns PDFArtifact when artifact exists", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ job_id: "job-1" }], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [{
          file_size_bytes: 1024,
          file_name: "report.pdf",
          rendered_at: new Date(),
        }],
        rowCount: 1,
      } as any);

    const result = await service.getArtifactInfo("run-1");

    expect(result.filename).toBe("report.pdf");
    expect(result.sizeBytes).toBe(1024);
  });

  it("resolveOrganizationID returns id when organization exists", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }], rowCount: 1 } as any);

    const result = await service.resolveOrganizationID("Acme Corp");

    expect(result).toBe("org-1");
  });

  it("render throws when report run not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await expect(
      service.render("run-1", "org-1", brand, reportData, sections),
    ).rejects.toThrow("report run not found");
  });

  it("getArtifactBytes throws when report run not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await expect(service.getArtifactBytes("run-1")).rejects.toThrow("report run not found");
  });

  it("getArtifactInfo throws when artifact not found", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ job_id: "job-1" }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await expect(service.getArtifactInfo("run-1")).rejects.toThrow("artifact not found for this run");
  });

  it("resolveOrganizationID throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await expect(service.resolveOrganizationID("Unknown")).rejects.toThrow("organization not found");
  });
});
