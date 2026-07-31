import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
import { query, queryTx } from "../src/services/db";
import { ReportRunStateMachineService, validateTransition, ErrInvalidTransition, isInvalidTransition } from "../src/services/reports/report_run/state_machine";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryTx = queryTx as jest.MockedFunction<typeof queryTx>;

function resetMocks() {
  mockQuery.mockReset();
  mockQueryTx.mockReset();
}

let svc: ReportRunStateMachineService;

beforeEach(() => {
  resetMocks();
  svc = new ReportRunStateMachineService();
});

function makeRunRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "run-1",
    organization_id: "org-1",
    schedule_id: null,
    job_id: null,
    status: "scheduled",
    current_stage: "scheduled",
    stage_started_at: new Date(),
    stage_metadata: null,
    created_at: new Date(),
    delivered_at: null,
    error_details: null,
    ...overrides,
  };
}

describe("ReportRunStateMachineService - positive scenarios", () => {
  it("creates a run", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRunRow()] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const run = await svc.createRun({ organizationName: "acme" });
    expect(run.status).toBe("scheduled");
  });

  it("transitions a run from scheduled to queued", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRunRow()] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRunRow({ status: "queued", current_stage: "queued" })] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const run = await svc.transition("run-1", "acme", { toStatus: "queued" });
    expect(run.status).toBe("queued");
  });

  it("gets a run by ID", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRunRow()] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const run = await svc.getRun("run-1", "acme");
    expect(run.id).toBe("run-1");
  });

  it("lists runs with filter", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ count: "1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRunRow()] } as any);
    const [runs, total] = await svc.listRuns("acme", { limit: 10, offset: 0 });
    expect(total).toBe(1);
  });
});

describe("ReportRunStateMachineService - negative scenarios", () => {
  it("throws when organization_name is empty for createRun", async () => {
    await expect(svc.createRun({ organizationName: "" })).rejects.toThrow("organization_name is required");
  });

  it("throws when organization not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.resolveOrganizationID("unknown")).rejects.toThrow("organization not found");
  });

  it("throws invalid transition error", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRunRow()] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.transition("run-1", "acme", { toStatus: "delivered" })).rejects.toThrow(ErrInvalidTransition);
  });

  it("throws when run not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.getRun("invalid", "acme")).rejects.toThrow("report run not found");
  });
});

describe("validateTransition utility", () => {
  it("validates valid transition", () => {
    expect(() => validateTransition("scheduled", "queued")).not.toThrow();
  });

  it("throws ErrInvalidTransition for invalid transition", () => {
    expect(() => validateTransition("scheduled", "delivered")).toThrow(ErrInvalidTransition);
    expect(isInvalidTransition(new ErrInvalidTransition("a", "b"))).toBe(true);
  });
});
