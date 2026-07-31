import { v4 as uuid } from "uuid";
import { EventBusImpl, Topic, EventType, StreamEvent } from "./event_bus_impl";

export interface ReportJob {
  id: string;
  orgId: string;
  reportType: string;
  params: Record<string, unknown>;
  status: string;
  progress: number;
  resultData: unknown;
  error: string;
}

export class ReportStreamServiceImpl {
  private jobs = new Map<string, ReportJob>();

  constructor(private eventBus: EventBusImpl) {}

  async generateReport(
    orgId: string,
    reportType: string,
    jobName?: string,
    params?: Record<string, unknown>,
  ): Promise<string> {
    if (!orgId) throw new Error("org_id is required");

    const supported = new Set(["kpi_list", "gross_margin"]);
    if (!supported.has(reportType)) {
      throw new Error(
        `unsupported report type: ${reportType} (supported: kpi_list, gross_margin)`,
      );
    }

    if (!jobName) {
      const now = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
      jobName = `${orgId}_${reportType}_${now}`;
    }

    if (this.jobs.has(jobName)) {
      throw new Error(`a job named '${jobName}' is already running`);
    }

    const job: ReportJob = {
      id: jobName,
      orgId,
      reportType,
      params: params ?? {},
      status: "pending",
      progress: 0,
      resultData: null,
      error: "",
    };
    this.jobs.set(jobName, job);

    this.runJob(job).catch((err) => {
      console.error(`Report job ${job.id} failed:`, err);
    });

    return jobName;
  }

  getJob(jobId: string): ReportJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return { ...job };
  }

  listJobs(orgId: string): ReportJob[] {
    return Array.from(this.jobs.values())
      .filter((j) => j.orgId === orgId)
      .map((j) => ({ ...j }));
  }

  private async runJob(job: ReportJob): Promise<void> {
    this.updateJob(job, "running", 0, null, "");
    this.publishProgress(job, 0, "Job started");

    try {
      let resultData: unknown;

      switch (job.reportType) {
        case "kpi_list":
          resultData = await this.generateKPIListReport(job);
          break;
        case "gross_margin":
          resultData = await this.generateGrossMarginReport(job);
          break;
        default:
          throw new Error(`unsupported report type: ${job.reportType}`);
      }

      this.updateJob(job, "completed", 100, resultData, "");
      this.publishCompleted(job, resultData);
      console.log(`Report job ${job.id} completed successfully`);
    } catch (err: any) {
      this.updateJob(job, "failed", 0, null, err.message);
      this.publishProgress(job, 0, `Job failed: ${err.message}`);
      console.log(`Report job ${job.id} failed: ${err.message}`);
    }
  }

  private async generateKPIListReport(
    job: ReportJob,
  ): Promise<unknown> {
    this.publishProgress(job, 25, "Fetching KPIs");
    await sleep(200);

    return {
      kpis: [],
      total: 0,
    };
  }

  private async generateGrossMarginReport(
    job: ReportJob,
  ): Promise<unknown> {
    this.publishProgress(job, 30, "Querying gross margin data");
    await sleep(300);

    this.publishProgress(job, 70, "Computing metrics");

    this.publishProgress(job, 90, "Finalising");
    return {};
  }

  private updateJob(
    job: ReportJob,
    status: string,
    progress: number,
    data: unknown,
    errMsg: string,
  ): void {
    job.status = status;
    job.progress = progress;
    job.resultData = data;
    job.error = errMsg;
  }

  private publishProgress(job: ReportJob, pct: number, msg: string): void {
    const topic = `${Topic.Report}.${job.id}`;
    const payload: Record<string, unknown> = {
      job_id: job.id,
      report_type: job.reportType,
      progress: pct,
      message: msg,
    };
    const event = this.eventBus.newStreamEvent(
      topic,
      EventType.ReportProgress,
      job.orgId,
      payload,
    );
    this.eventBus.publish(topic, event);
  }

  private publishCompleted(job: ReportJob, data: unknown): void {
    const topic = `${Topic.Report}.${job.id}`;
    const payload: Record<string, unknown> = {
      job_id: job.id,
      report_type: job.reportType,
      progress: 100,
      result: data,
    };
    const event = this.eventBus.newStreamEvent(
      topic,
      EventType.ReportCompleted,
      job.orgId,
      payload,
    );
    this.eventBus.publish(topic, event);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
