import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { query } from "../src/services/db";
import { WorkflowBehaviorAnalyzerService } from "../src/services/workflow_behavior_analyzer_service";

const mockQuery = query as jest.Mock;

describe("WorkflowBehaviorAnalyzerService", () => {
  let service: WorkflowBehaviorAnalyzerService;

  beforeEach(() => {
    service = new WorkflowBehaviorAnalyzerService();
    jest.clearAllMocks();
  });

  describe("getAccountingWorkflowStatus", () => {
    it("returns status report with percentages", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { status: "completed", cnt: "80" },
          { status: "pending", cnt: "20" },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ avg_hours: 24 }],
      });
      const result = await service.getAccountingWorkflowStatus("Org");
      expect(result.domain).toBe("accounting");
      expect(result.total).toBe(100);
      expect(result.completedPct).toBe(80);
    });

    it("filters by fiscal year", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_hours: 0 }] });
      const result = await service.getAccountingWorkflowStatus("Org", 2024);
      expect(result.total).toBe(0);
    });

    it("computes avgDurationHours", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ status: "completed", cnt: "10" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_hours: 48.5 }] });
      const result = await service.getAccountingWorkflowStatus("Org");
      expect(result.avgDurationHours).toBe(48.5);
    });

    it("handles zero duration when no completed", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ status: "pending", cnt: "5" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_hours: 0 }] });
      const result = await service.getAccountingWorkflowStatus("Org");
      expect(result.avgDurationHours).toBe(0);
    });

    it("throws when org name empty", async () => {
      await expect(service.getAccountingWorkflowStatus("")).rejects.toThrow(
        "organization_name is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getAccountingWorkflowStatus("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getAccountingWorkflowStatus("Org")).rejects.toThrow("db error");
    });

    it("handles zero total gracefully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ avg_hours: 0 }] });
      const result = await service.getAccountingWorkflowStatus("Org");
      expect(result.completedPct).toBe(0);
    });
  });

  describe("getSalesWorkflowStatus", () => {
    it("returns sales status report", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { status: "active", cnt: "15" },
          { status: "inactive", cnt: "5" },
        ],
      });
      const result = await service.getSalesWorkflowStatus("Org");
      expect(result.domain).toBe("sales");
      expect(result.total).toBe(20);
    });

    it("computes completedPct from active status", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { status: "active", cnt: "75" },
          { status: "inactive", cnt: "25" },
        ],
      });
      const result = await service.getSalesWorkflowStatus("Org");
      expect(result.completedPct).toBe(75);
    });

    it("handles empty result set", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getSalesWorkflowStatus("Org");
      expect(result.total).toBe(0);
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.getSalesWorkflowStatus("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.getSalesWorkflowStatus("Org")).rejects.toThrow("db error");
    });

    it("handles single status type", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ status: "active", cnt: "10" }] });
      const result = await service.getSalesWorkflowStatus("Org");
      expect(result.statuses).toHaveLength(1);
    });

    it("computes percentage correctly", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { status: "active", cnt: "30" },
          { status: "inactive", cnt: "70" },
        ],
      });
      const result = await service.getSalesWorkflowStatus("Org");
      expect(result.statuses[1].percentage).toBe(70);
    });

    it("has generatedAt date", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.getSalesWorkflowStatus("Org");
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe("identifyBlockedWorkflows", () => {
    it("returns blocked workflows", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "wf1", name: "Workflow 1", status: "pending",
            created_at: new Date("2024-01-01"), days_pending: "15",
            fiscal_year: 2024, fiscal_period: "Q1",
          },
        ],
      });
      const result = await service.identifyBlockedWorkflows("Org", 7);
      expect(result.totalBlocked).toBe(1);
      expect(result.workflows[0].daysPending).toBe(15);
    });

    it("filters by pending threshold", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.identifyBlockedWorkflows("Org", 30);
      expect(result.totalBlocked).toBe(0);
    });

    it("handles empty result", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.identifyBlockedWorkflows("Org");
      expect(result.workflows).toEqual([]);
    });

    it("handles missing fiscal fields", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "wf1", name: "W1", status: "started",
            created_at: new Date("2024-06-01"), days_pending: "10",
            fiscal_year: null, fiscal_period: null,
          },
        ],
      });
      const result = await service.identifyBlockedWorkflows("Org", 5);
      expect(result.workflows[0].fiscalYear).toBeUndefined();
      expect(result.workflows[0].fiscalPeriod).toBeUndefined();
    });

    it("throws when org name empty", async () => {
      await expect(service.identifyBlockedWorkflows("")).rejects.toThrow(
        "organization_name is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.identifyBlockedWorkflows("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.identifyBlockedWorkflows("Org")).rejects.toThrow("db error");
    });

    it("generatedAt is set", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.identifyBlockedWorkflows("Org");
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe("compareAccountingWorkflowCompletionByYear", () => {
    it("compares completion across years", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "100", completed: "80" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "50", completed: "30" }] });
      const result = await service.compareAccountingWorkflowCompletionByYear("Org", [2023, 2024]);
      expect(result.periods).toHaveLength(2);
    });

    it("identifies best period", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "100", completed: "90" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "100", completed: "50" }] });
      const result = await service.compareAccountingWorkflowCompletionByYear("Org", [2023, 2024]);
      expect(result.bestPeriod).toBe("2023");
    });

    it("handles single year", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "10", completed: "5" }] });
      const result = await service.compareAccountingWorkflowCompletionByYear("Org", [2024]);
      expect(result.periods).toHaveLength(1);
    });

    it("handles zero totals", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "0", completed: "0" }] });
      const result = await service.compareAccountingWorkflowCompletionByYear("Org", [2024]);
      expect(result.periods[0].completedPct).toBe(0);
    });

    it("throws when years array empty", async () => {
      await expect(service.compareAccountingWorkflowCompletionByYear("Org", [])).rejects.toThrow(
        "at least one fiscal year is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(service.compareAccountingWorkflowCompletionByYear("Unknown", [2024])).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockRejectedValueOnce(new Error("db error"));
      await expect(service.compareAccountingWorkflowCompletionByYear("Org", [2024])).rejects.toThrow("db error");
    });

    it("skips missing rows gracefully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await service.compareAccountingWorkflowCompletionByYear("Org", [2024]);
      expect(result.periods).toHaveLength(0);
    });
  });
});
