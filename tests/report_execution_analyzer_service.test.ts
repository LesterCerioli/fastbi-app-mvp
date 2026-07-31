import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { ReportExecutionAnalyzerService } from "../src/services/reports/report_execution_analyzer_service";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("ReportExecutionAnalyzerService", () => {
  let service: ReportExecutionAnalyzerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportExecutionAnalyzerService();
  });

  it("getRunStatusDistribution returns distribution with rates", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { status: "completed", cnt: "80" },
          { status: "failed", cnt: "20" },
        ],
      } as any);

    const result = await service.getRunStatusDistribution("Acme Corp");

    expect(result.totalRuns).toBe(100);
    expect(result.successRatePct).toBe(80);
    expect(result.failureRatePct).toBe(20);
  });

  it("getStageBottlenecks returns stages with first as bottleneck", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { stage: "rendering", avg_duration_ms: "5000", max_duration_ms: "10000", sample_count: "50" },
          { stage: "data_fetch", avg_duration_ms: "1000", max_duration_ms: "3000", sample_count: "50" },
        ],
      } as any);

    const result = await service.getStageBottlenecks("Acme Corp");

    expect(result.bottleneckStage).toBe("rendering");
    expect(result.stages[0].isBottleneck).toBe(true);
  });

  it("getFailureRate returns daily and overall failure stats", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { day: "2025-01-01", total_runs: "10", failed_runs: "2" },
          { day: "2025-01-02", total_runs: "20", failed_runs: "5" },
        ],
      } as any)
      .mockResolvedValueOnce({
        rows: [{ total_failed: "7", total_runs: "30" }],
      } as any);

    const result = await service.getFailureRate("Acme Corp", 7);

    expect(result.daily).toHaveLength(2);
    expect(result.overallFailureRatePct).toBeCloseTo(23.33, 1);
  });

  it("getDeliveryTimeTrend returns trend direction", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
      .mockResolvedValueOnce({
        rows: [{ avg_delivery_min: "30", min_delivery_min: "10", max_delivery_min: "60", sample_count: "50" }],
      } as any)
      .mockResolvedValueOnce({
        rows: [{ avg_delivery_min: "20", min_delivery_min: "5", max_delivery_min: "40", sample_count: "50" }],
      } as any);

    const result = await service.getDeliveryTimeTrend("Acme Corp", 30);

    expect(result.trendDirection).toBeDefined();
  });

  it("getRunStatusDistribution throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.getRunStatusDistribution("Unknown")).rejects.toThrow("organization not found");
  });

  it("getStageBottlenecks throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.getStageBottlenecks("Unknown")).rejects.toThrow("organization not found");
  });

  it("getFailureRate throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.getFailureRate("Unknown", 7)).rejects.toThrow("organization not found");
  });

  it("getDeliveryTimeTrend throws when org not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    await expect(service.getDeliveryTimeTrend("Unknown", 30)).rejects.toThrow("organization not found");
  });
});
