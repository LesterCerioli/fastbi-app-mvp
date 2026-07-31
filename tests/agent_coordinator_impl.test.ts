import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid-abc") }));

import { AgentCoordinatorImpl } from "../src/services/mcp_impl/agent_coordinator_impl";
import { IntelligentAgentEngine } from "../src/services/ai/intelligent_agent_engine";
import { query } from "../src/services/db";

const mockAgentEngine = {
  execute: jest.fn(),
} as unknown as jest.Mocked<IntelligentAgentEngine>;

const coordinator = new AgentCoordinatorImpl(mockAgentEngine, 2);

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AgentCoordinatorImpl", () => {
  // --- Positive ---

  it("submitTask inserts task and returns taskId", async () => {
    mockQuery([]); // INSERT
    const taskId = await coordinator.submitTask({
      organizationId: "org-1",
      taskType: "diagnose",
      priority: 1,
      parameters: { region: "US" },
    });
    expect(taskId).toBe("mock-uuid-abc");
  });

  it("getTaskStatus returns status from DB", async () => {
    mockQuery([{ status: "completed", created_at: new Date(), started_at: new Date(), completed_at: new Date(), error_message: null }]);
    const result = await coordinator.getTaskStatus("task-1");
    expect(result.status).toBe("completed");
    expect(result.id).toBe("task-1");
  });

  it("executeAnalysis returns AgentResult with insights", async () => {
    mockAgentEngine.execute.mockResolvedValueOnce({
      insights: [{ type: "trend", severity: "info", title: "Upward trend", description: "Sales increasing", confidence: 0.9, metadata: {} }],
      anomalies: [],
      recommendations: ["Increase inventory"],
      confidence: 0.9,
      executedAt: new Date(),
    } as any);
    const result = await coordinator.executeAnalysis("org-1", "diagnose_decline" as any, {});
    expect(result.insights).toHaveLength(1);
    expect(result.taskId).toBe("mock-uuid-abc");
  });

  it("listPendingInsights returns insights from DB", async () => {
    mockQuery([{ insight_type: "trend", severity: "info", title: "Test", description: "Desc", confidence: "0.85", metadata: "{}", created_at: new Date() }]);
    const result = await coordinator.listPendingInsights("org-1");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test");
  });

  // --- Negative ---

  it("submitTask throws when queue is full", async () => {
    // Fill queue with 100 items
    for (let i = 0; i < 100; i++) {
      mockQuery([]);
      await coordinator.submitTask({ organizationId: "org-1", taskType: "monitor", priority: 1, parameters: {} });
    }
    await expect(coordinator.submitTask({ organizationId: "org-1", taskType: "monitor", priority: 1, parameters: {} })).rejects.toThrow("task queue is full");
  });

  it("getTaskResult throws on task error", async () => {
    const coordinator2 = new AgentCoordinatorImpl(mockAgentEngine, 2);
    mockQuery([]); // submit INSERT
    const taskId = await coordinator2.submitTask({ organizationId: "org-1", taskType: "diagnose", priority: 1, parameters: {} });
    // The task is in queue but not processed; manually set an error result
    (coordinator2 as any).results.set(taskId, { error: "something went wrong", status: "failed" });
    await expect(coordinator2.getTaskResult(taskId)).rejects.toThrow("something went wrong");
  });

  it("getTaskStatus throws on not found", async () => {
    mockQuery([]);
    await expect(coordinator.getTaskStatus("missing")).rejects.toThrow("task not found");
  });

  it("scheduleRecurringAnalysis inserts scheduled task", async () => {
    mockQuery([]);
    await expect(coordinator.scheduleRecurringAnalysis("org-1", "0 8 * * *", "diagnose_decline" as any)).resolves.toBeUndefined();
  });
});
