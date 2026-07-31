import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("../src/services/reports/report_schedule/cron_evaluator", () => ({
  cadenceToExpression: jest.fn(),
  nextRunTime: jest.fn(),
}));
import { query } from "../src/services/db";
import { cadenceToExpression, nextRunTime } from "../src/services/reports/report_schedule/cron_evaluator";
import { ReportScheduleService } from "../src/services/reports/report_schedule/report_schedule_service";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCadence = cadenceToExpression as jest.MockedFunction<typeof cadenceToExpression>;
const mockNextRun = nextRunTime as jest.MockedFunction<typeof nextRunTime>;
const svc = new ReportScheduleService();

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "sched-1",
    organization_id: "org-1",
    template_id: null,
    name: "Daily Report",
    cron_expression: "0 0 * * *",
    timezone: "UTC",
    export_format: "pdf",
    language: "en",
    distribution_list_id: null,
    is_active: true,
    next_run_at: new Date("2025-01-02"),
    last_run_at: null,
    created_at: new Date("2025-01-01"),
    updated_at: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("ReportScheduleService - positive scenarios", () => {
  it("creates a schedule with cadence", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
    mockCadence.mockReturnValueOnce("0 0 * * *");
    mockNextRun.mockReturnValueOnce(new Date("2025-01-02"));
    mockQuery.mockResolvedValueOnce({ rows: [makeRow()] } as any);
    const sched = await svc.createSchedule({ organizationName: "acme", name: "Daily Report", cadence: "daily", timezone: "UTC" });
    expect(sched.name).toBe("Daily Report");
    expect(sched.isActive).toBe(true);
  });

  it("lists schedules with filter", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: "1" }] } as any);
    mockQuery.mockResolvedValueOnce({ rows: [makeRow()] } as any);
    const [list, total] = await svc.listSchedules("org-1", { isActive: true, limit: 10, offset: 0 });
    expect(total).toBe(1);
    expect(list[0].name).toBe("Daily Report");
  });

  it("gets schedule by ID", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makeRow()] } as any);
    const sched = await svc.getScheduleByID("sched-1");
    expect(sched.id).toBe("sched-1");
  });

  it("deletes schedule (soft)", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
    await expect(svc.deleteSchedule("sched-1")).resolves.toBeUndefined();
  });
});

describe("ReportScheduleService - negative scenarios", () => {
  it("throws when name is empty for createSchedule", async () => {
    await expect(svc.createSchedule({ organizationName: "acme", name: "", timezone: "UTC" })).rejects.toThrow("name is required");
  });

  it("throws when organization not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.resolveOrganizationID("unknown")).rejects.toThrow("organization not found");
  });

  it("throws when schedule not found by ID", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(svc.getScheduleByID("invalid")).rejects.toThrow("report schedule not found");
  });

  it("throws when delete affects no rows", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 } as any);
    await expect(svc.deleteSchedule("invalid")).rejects.toThrow("report schedule not found");
  });
});
