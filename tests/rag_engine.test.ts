import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

jest.mock("../src/services/ai/vectorizer", () => ({
  EnhancedTFIDFVectorizer: jest.fn().mockImplementation(() => ({
    textToVector: jest.fn()
      .mockReturnValueOnce([0.5, 0.3, 0.2])
      .mockReturnValueOnce([0.4, 0.35, 0.25])
      .mockReturnValueOnce([0.1, 0.1, 0.8]),
    cosineSimilarity: jest.fn()
      .mockReturnValueOnce(0.95)
      .mockReturnValueOnce(0.15),
  })),
}));

import { query } from "../src/services/db";
import { RAGEngine } from "../src/services/ai/rag_engine";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("RAGEngine", () => {
  let engine: RAGEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new RAGEngine();
  });

  it("findSimilarContext returns contexts with similarity > 0.3", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { title: "Revenue Growth", description: "Revenue grew 20%", metadata: {} },
        { title: "Cost Analysis", description: "Costs reduced 10%", metadata: {} },
      ],
    } as any);

    const result = await engine.findSimilarContext("org-1", "revenue growth", 5);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].similarity).toBeGreaterThan(0.3);
  });

  it("findSimilarHistoricalIssues calls findSimilarContext with correct query", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const result = await engine.findSimilarHistoricalIssues("org-1", "revenue_drop", { revenue: 100 });

    expect(result).toEqual([]);
  });

  it("getRelevantKnowledge returns formatted string from similar contexts", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { title: "Growth Insight", description: "Revenue up 15%", metadata: {} },
      ],
    } as any);

    const result = await engine.getRelevantKnowledge("org-1", {
      metric: "revenue",
      change_percent: 15,
      dimension: "region",
    });

    expect(result).toContain("similarity");
    expect(result).toContain("Growth Insight");
  });

  it("getRelevantKnowledge returns empty string when no situation parts match", async () => {
    const result = await engine.getRelevantKnowledge("org-1", { unrelated: "data" });

    expect(result).toBe("");
  });

  it("findSimilarContext returns empty array when no rows", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const result = await engine.findSimilarContext("org-1", "test", 5);

    expect(result).toEqual([]);
  });

  it("findSimilarContext sorts results by similarity descending", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { title: "A", description: "low match", metadata: {} },
        { title: "B", description: "high match", metadata: {} },
      ],
    } as any);

    const result = await engine.findSimilarContext("org-1", "test", 5);

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].similarity).toBeGreaterThanOrEqual(result[i].similarity);
    }
  });

  it("findSimilarContext limits results to limit parameter", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: Array(10).fill(null).map((_, i) => ({
        title: `Title ${i}`, description: "test", metadata: {},
      })),
    } as any);

    const result = await engine.findSimilarContext("org-1", "test", 3);

    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("getRelevantKnowledge handles negative change_percent", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const result = await engine.getRelevantKnowledge("org-1", {
      metric: "sales",
      change_percent: -10,
    });

    expect(result).toBe("");
  });
});
