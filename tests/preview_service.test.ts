import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

jest.mock("../src/services/reports/report_template_preview/synthetic_data_generator", () => {
  return {
    SyntheticDataGenerator: jest.fn().mockImplementation(() => ({
      generateKPISummaryData: jest.fn().mockReturnValue([{ kpi: "revenue", value: 100 }]),
      generateTimeSeries: jest.fn().mockReturnValue([{ date: "2025-01-01", value: 50 }]),
      generateTableRows: jest.fn().mockReturnValue([{ name: "item", revenue: 100 }]),
      generateForBinding: jest.fn().mockReturnValue("generated"),
    })),
  };
});

import { query } from "../src/services/db";
import { TemplatePreviewService } from "../src/services/reports/report_template_preview/preview_service";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("TemplatePreviewService", () => {
  let service: TemplatePreviewService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TemplatePreviewService("http://test.com");
  });

  it("triggerPreview returns PreviewArtifact for synthetic html preview", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ version: "2" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { id: "s1", type: "kpi_summary", order_index: 1, config: "{}", is_optional: false, visibility_rule: "{}" },
        ],
      } as any)
      .mockResolvedValueOnce({ rows: [{ id: "pv-1" }] } as any)
      .mockResolvedValueOnce({} as any);

    const result = await service.triggerPreview("Acme Corp", "Monthly Report", {
      organizationName: "Acme Corp",
      dataSource: "synthetic",
      format: "html",
    });

    expect(result.id).toBe("pv-1");
    expect(result.format).toBe("html");
    expect(result.estimatedPages).toBeGreaterThan(0);
  });

  it("runBenchmark returns BenchmarkResult with performance stats", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { id: "s1", type: "kpi_summary", order_index: 1, config: "{}", is_optional: false, visibility_rule: "{}" },
        ],
      } as any);

    const result = await service.runBenchmark("Acme Corp", "Monthly Report");

    expect(result.simulatedRuns).toBe(10);
    expect(result.p50Ms).toBeGreaterThanOrEqual(0);
  });

  it("listPreviews returns list of PreviewArtifact", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [{ id: "tmpl-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: "pv-1", template_id: "tmpl-1", version: 1,
            format: "html", data_source: "synthetic",
            artifact_url: "/url", render_time_ms: "100",
            section_count: "2", estimated_pages: "1", created_at: new Date(),
          },
        ],
      } as any);

    const result = await service.listPreviews("Acme Corp", "Monthly Report");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("pv-1");
  });

  it("getPreview returns a single PreviewArtifact", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [{
          id: "pv-1", template_id: "tmpl-1", version: 1,
          format: "html", data_source: "synthetic",
          artifact_url: "/url", render_time_ms: "100",
          section_count: "2", estimated_pages: "1", created_at: new Date(),
        }],
      } as any);

    const result = await service.getPreview("Acme Corp", "Monthly Report", "pv-1");

    expect(result.id).toBe("pv-1");
  });

  it("triggerPreview throws when org name is empty", async () => {
    await expect(
      service.triggerPreview("", "Monthly Report", {
        organizationName: "", dataSource: "synthetic", format: "html",
      }),
    ).rejects.toThrow("organization_name is required");
  });

  it("triggerPreview throws when format is unsupported", async () => {
    await expect(
      service.triggerPreview("Acme Corp", "Monthly Report", {
        organizationName: "Acme Corp", dataSource: "synthetic", format: "xml" as any,
      }),
    ).rejects.toThrow("unsupported format");
  });

  it("resolveOrganizationID throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.resolveOrganizationID("Unknown")).rejects.toThrow("organization not found");
  });

  it("resolveTemplateID throws when template not found", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.resolveTemplateID("org-1", "Unknown")).rejects.toThrow("report template not found");
  });
});
