import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { AgentTaskAnalyzerService } from "../src/services/ai/agent_task_analyzer_service";
import { query } from "../src/services/db";

const service = new AgentTaskAnalyzerService();

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AgentTaskAnalyzerService", () => {
  it("getTaskThroughputByType computes success rates and best/worst", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { task_type: "analysis", total_count: 20, completed_count: 18, failed_count: 1, avg_duration_sec: 30 },
      { task_type: "reporting", total_count: 10, completed_count: 5, failed_count: 3, avg_duration_sec: 45 },
    ]);
    const result = await service.getTaskThroughputByType("Acme");
    expect(result.best_performing_type).toBe("analysis");
    expect(result.worst_performing_type).toBe("reporting");
  });

  it("getBacklogAnalysis returns buckets and totals", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { priority: 10, cnt: 3, oldest: new Date("2025-01-01") },
      { priority: 5, cnt: 7, oldest: new Date("2025-02-01") },
    ]);
    mockQuery([{ pending: 8, in_progress: 2 }]);
    const result = await service.getBacklogAnalysis("Acme");
    expect(result.total_pending).toBe(8);
    expect(result.total_in_progress).toBe(2);
    expect(result.priority_buckets[0].priority_label).toBe("critical");
  });

  it("getTaskFailurePatterns returns rows sorted by failures", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { task_type: "sync", failed_count: 10, total_count: 20 },
      { task_type: "parse", failed_count: 3, total_count: 15 },
    ]);
    const result = await service.getTaskFailurePatterns("Acme", 30);
    expect(result.highest_failure_type).toBe("sync");
    expect(result.rows[0].failure_rate_pct).toBe(50);
  });

  it("getTaskDurationBenchmarks returns slowest and fastest", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([
      { task_type: "heavy", avg_sec: 120, min_sec: 60, max_sec: 200, sample_count: 10 },
      { task_type: "light", avg_sec: 5, min_sec: 1, max_sec: 10, sample_count: 50 },
    ]);
    const result = await service.getTaskDurationBenchmarks("Acme");
    expect(result.slowest_type).toBe("heavy");
    expect(result.fastest_type).toBe("light");
  });

  it("getTaskThroughputByType throws for missing org", async () => {
    mockQuery([]);
    await expect(service.getTaskThroughputByType("Ghost")).rejects.toThrow("organization not found");
  });

  it("getBacklogAnalysis throws for empty org name", async () => {
    await expect(service.getBacklogAnalysis("")).rejects.toThrow("organization_name is required");
  });

  it("getTaskFailurePatterns throws for missing org", async () => {
    mockQuery([]);
    await expect(service.getTaskFailurePatterns("Ghost", 30)).rejects.toThrow("organization not found");
  });

  it("getTaskDurationBenchmarks returns empty strings for no data", async () => {
    mockQuery([{ id: "1" }]);
    mockQuery([]);
    const result = await service.getTaskDurationBenchmarks("Acme");
    expect(result.slowest_type).toBe("");
    expect(result.fastest_type).toBe("");
  });
});
