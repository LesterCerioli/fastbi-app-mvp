import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { FeedbackAnalysisService } from "../src/services/ai/feedback_analysis_service";
import { query } from "../src/services/db";

describe("FeedbackAnalysisService", () => {
  let service: FeedbackAnalysisService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeedbackAnalysisService();
  });

  describe("getFeedbackSentimentDistribution", () => {
    it("returns sentiment distribution", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { feedback_type: "positive", cnt: 10, action_taken_pct: 80, avg_impact: 4.5 },
          { feedback_type: "negative", cnt: 5, action_taken_pct: 20, avg_impact: 1.2 },
        ],
      });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ action_taken: 9, grand_total: 15 }],
      });
      const result = await service.getFeedbackSentimentDistribution();
      expect(result.totalFeedback).toBe(15);
      expect(result.positiveRatePct).toBeGreaterThan(0);
    });

    it("handles empty result", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.getFeedbackSentimentDistribution();
      expect(result.totalFeedback).toBe(0);
      expect(result.positiveRatePct).toBe(0);
    });

    it("handles zero grand total", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ action_taken: 0, grand_total: 0 }] });
      const result = await service.getFeedbackSentimentDistribution();
      expect(result.overallActionTakenPct).toBe(0);
    });
  });

  describe("getInsightActionRate", () => {
    it("returns top and least performing insights", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { insight_id: "i1", total_feedback: 5, action_taken_pct: 90, avg_impact: 4.0, positive_pct: 80 },
          { insight_id: "i2", total_feedback: 3, action_taken_pct: 30, avg_impact: 1.0, positive_pct: 20 },
        ],
      });
      const result = await service.getInsightActionRate(1);
      expect(result.topPerformingInsights.length).toBe(1);
      expect(result.leastActedOnInsights.length).toBe(1);
    });

    it("returns empty arrays when no data", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.getInsightActionRate(5);
      expect(result.topPerformingInsights).toEqual([]);
      expect(result.leastActedOnInsights).toEqual([]);
    });
  });

  describe("getAnalysisResultPatterns", () => {
    it("returns analysis patterns", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { analysis_type: "trend", cnt: 10 },
          { analysis_type: "anomaly", cnt: 5 },
        ],
      });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { business_context: "sales", cnt: 8 },
        ],
      });
      const result = await service.getAnalysisResultPatterns();
      expect(result.totalResults).toBe(15);
      expect(result.mostCommonType).toBe("trend");
      expect(result.mostCommonContext).toBe("sales");
    });

    it("handles empty results", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.getAnalysisResultPatterns();
      expect(result.totalResults).toBe(0);
      expect(result.mostCommonType).toBe("");
      expect(result.mostCommonContext).toBe("");
    });
  });

  describe("getDatasetProfileSummary", () => {
    it("returns dataset profile summary", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { format_type: "csv", cnt: 5, avg_rows: 1000, avg_columns: 10 },
          { format_type: "json", cnt: 3, avg_rows: 500, avg_columns: 8 },
        ],
      });
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: 8, overall_rows: 800, overall_cols: 9 }],
      });
      const result = await service.getDatasetProfileSummary();
      expect(result.totalDatasets).toBe(8);
      expect(result.largestAvgRowsFormat).toBe("csv");
    });

    it("handles empty result", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const result = await service.getDatasetProfileSummary();
      expect(result.totalDatasets).toBe(0);
      expect(result.largestAvgRowsFormat).toBe("");
    });

    it("uses empty string when no format breakdown", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ total: 0, overall_rows: 0, overall_cols: 0 }] });
      const result = await service.getDatasetProfileSummary();
      expect(result.largestAvgRowsFormat).toBe("");
    });
  });
});
