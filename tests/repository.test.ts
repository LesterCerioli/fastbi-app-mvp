import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
import { query } from "../src/services/db";
import { AgentRepository } from "../src/services/ai/repository";

const mockQuery = query as jest.MockedFunction<typeof query>;
const repo = new AgentRepository();

describe("AgentRepository - positive scenarios", () => {
  it("saves a pattern", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    await expect(repo.savePattern("org-1", "sig", "action", 1, 0.9)).resolves.toBeUndefined();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("finds similar patterns", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: "p1", trigger_signature: "sig", action_taken: "action", outcome_success: 1, effectiveness_score: 0.9 }],
    } as any);
    const patterns = await repo.findSimilarPatterns("org-1", "sig", 10);
    expect(patterns.length).toBe(1);
    expect(patterns[0].effectiveness).toBe(0.9);
  });

  it("saves an insight", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    await expect(repo.saveInsight("org-1", "trend", "high", "title", "desc", 0.85, {})).resolves.toBeUndefined();
  });

  it("saves an anomaly", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    await expect(repo.saveAnomaly("org-1", "revenue", "region", "US", 1000, 500, 2.5)).resolves.toBeUndefined();
  });
});

describe("AgentRepository - negative scenarios", () => {
  it("throws when savePattern query fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db error"));
    await expect(repo.savePattern("org-1", "sig", "action", 1, 0.9)).rejects.toThrow("db error");
  });

  it("returns empty array when no similar patterns found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const patterns = await repo.findSimilarPatterns("org-1", "nonexistent", 10);
    expect(patterns).toEqual([]);
  });

  it("returns empty array for pending insights when none exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const insights = await repo.getPendingInsights("org-1", 10);
    expect(insights).toEqual([]);
  });

  it("returns empty array for pending anomalies when none exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const anomalies = await repo.getPendingAnomalies("org-1", 10);
    expect(anomalies).toEqual([]);
  });
});
