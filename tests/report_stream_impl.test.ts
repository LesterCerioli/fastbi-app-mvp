import { jest } from "@jest/globals";
jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));
import { EventBusImpl, Topic, EventType } from "../src/services/streaming/event_bus_impl";
import { ReportStreamServiceImpl } from "../src/services/streaming/report_stream_impl";

describe("ReportStreamServiceImpl - positive scenarios", () => {
  it("generates a kpi_list report and returns job id", async () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
    jest.spyOn(eventBus, "newStreamEvent").mockReturnValue({} as any);
    const svc = new ReportStreamServiceImpl(eventBus);
    const jobId = await svc.generateReport("org-1", "kpi_list");
    expect(typeof jobId).toBe("string");
    expect(jobId).toContain("org-1");
  });

  it("generates a gross_margin report", async () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
    jest.spyOn(eventBus, "newStreamEvent").mockReturnValue({} as any);
    const svc = new ReportStreamServiceImpl(eventBus);
    const jobId = await svc.generateReport("org-1", "gross_margin");
    expect(typeof jobId).toBe("string");
  });

  it("returns a job by id", async () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
    jest.spyOn(eventBus, "newStreamEvent").mockReturnValue({} as any);
    const svc = new ReportStreamServiceImpl(eventBus);
    const jobId = await svc.generateReport("org-1", "kpi_list", "my-job");
    const job = svc.getJob(jobId);
    expect(job).not.toBeNull();
    expect(job!.orgId).toBe("org-1");
  });

  it("lists jobs for a given org", async () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
    jest.spyOn(eventBus, "newStreamEvent").mockReturnValue({} as any);
    const svc = new ReportStreamServiceImpl(eventBus);
    await svc.generateReport("org-1", "kpi_list", "job-1");
    await svc.generateReport("org-1", "gross_margin", "job-2");
    const jobs = svc.listJobs("org-1");
    expect(jobs.length).toBe(2);
  });
});

describe("ReportStreamServiceImpl - negative scenarios", () => {
  it("throws when org_id is empty", async () => {
    const svc = new ReportStreamServiceImpl(new EventBusImpl());
    await expect(svc.generateReport("", "kpi_list")).rejects.toThrow("org_id is required");
  });

  it("throws for unsupported report type", async () => {
    const svc = new ReportStreamServiceImpl(new EventBusImpl());
    await expect(svc.generateReport("org-1", "invalid_type")).rejects.toThrow("unsupported report type");
  });

  it("throws when a job with the same name already exists", async () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
    jest.spyOn(eventBus, "newStreamEvent").mockReturnValue({} as any);
    const svc = new ReportStreamServiceImpl(eventBus);
    await svc.generateReport("org-1", "kpi_list", "dup-job");
    await expect(svc.generateReport("org-1", "kpi_list", "dup-job")).rejects.toThrow("already running");
  });

  it("returns null for non-existent job", () => {
    const svc = new ReportStreamServiceImpl(new EventBusImpl());
    expect(svc.getJob("nope")).toBeNull();
  });
});
