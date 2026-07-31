import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
import { query } from "../src/services/db";
import { ReportJobQueueService, DefaultMaxAttempts } from "../src/services/reports/report_queue/report_job_queue_service";

const mockQuery = query as jest.MockedFunction<typeof query>;
const svc = new ReportJobQueueService();

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    organization_id: "org-1",
    schedule_id: null,
    template_id: null,
    status: "queued",
    priority: "normal",
    attempt_count: "0",
    max_attempts: String(DefaultMaxAttempts),
    next_retry_at: null,
    error_message: null,
    created_at: new Date("2025-01-01"),
    started_at: null,
    completed_at: null,
    ...overrides,
  };
}

describe("ReportJobQueueService - positive scenarios", () => {
  it("enqueues a job with default values", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makeRow()], rowCount: 1 } as any);
    const job = await svc.enqueueJob({ organizationID: "org-1" });
    expect(job.status).toBe("queued");
    expect(job.priority).toBe("normal");
    expect(job.maxAttempts).toBe(DefaultMaxAttempts);
  });

  it("resolves organization ID by name", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    const id = await svc.resolveOrganizationID("acme");
    expect(id).toBe("org-1");
  });

  it("resolves job ID by created_at", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] } as any);
    const id = await svc.resolveJobIDByCreatedAt(new Date("2025-01-01"), "acme");
    expect(id).toBe("job-1");
  });

  it("returns queue metrics", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ queue_depth: 5, processing_count: 2, dlq_size: 1, failures_last_hour: 1, total_last_hour: 10 }],
    } as any);
    const metrics = await svc.queueMetrics();
    expect(metrics.queueDepth).toBe(5);
    expect(metrics.processingCount).toBe(2);
    expect(metrics.dlqSize).toBe(1);
    expect(metrics.failureRate).toBe(10);
  });
});

describe("ReportJobQueueService - negative scenarios", () => {
  it("throws when organizationID is empty for enqueueJob", async () => {
    await expect(svc.enqueueJob({ organizationID: "" })).rejects.toThrow("organization_id is required");
  });

  it("throws when organization_name is empty for resolveOrganizationID", async () => {
    await expect(svc.resolveOrganizationID("")).rejects.toThrow("organization_name is required");
  });

  it("throws when organization is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.resolveOrganizationID("unknown")).rejects.toThrow("organization not found");
  });

  it("throws when job not found for resolveJobIDByCreatedAt", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.resolveJobIDByCreatedAt(new Date("2025-01-01"), "acme")).rejects.toThrow("report job not found");
  });
});
