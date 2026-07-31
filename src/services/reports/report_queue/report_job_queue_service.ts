import { query } from "../../db";

export const JobsExchange = "fastbi.reports";
export const QueueJobHigh = "fastbi.reports.jobs.high";
export const QueueJobNormal = "fastbi.reports.jobs.normal";
export const QueueDLQ = "fastbi.reports.dlq";

export const RKJobHigh = "report.job.high";
export const RKJobNormal = "report.job.normal";
export const RKJobDLQ = "report.job.dead_lettered";

export const DefaultBaseDelay = 30_000;
export const DefaultMaxWait = 3_600_000;
export const DefaultWorkerCount = 5;
export const DefaultMaxAttempts = 3;

export const workerPollInterval = 2000;
export const retryPollInterval = 10000;

export type JobStatus = "queued" | "processing" | "completed" | "failed" | "retrying" | "dead_lettered";
export type JobPriority = "high" | "normal";

export interface ReportJobDTO {
  id: string;
  organizationID: string;
  scheduleID: string | null;
  templateID: string | null;
  status: JobStatus;
  priority: JobPriority;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface EnqueueJobRequest {
  organizationID: string;
  scheduleID?: string | null;
  templateID?: string | null;
  priority?: JobPriority;
  maxAttempts?: number;
}

export interface JobFilter {
  status?: JobStatus;
  limit: number;
  offset: number;
}

export interface QueueMetricsDTO {
  queueDepth: number;
  processingCount: number;
  dlqSize: number;
  failureRate: number;
}

export class ReportJobQueueService {
  private ctx: { cancelled: boolean } = { cancelled: false };

  start(): void {
    for (let i = 0; i < DefaultWorkerCount; i++) {
      this.worker();
    }
    this.retryPoller();
    console.log(`[ReportJobQueue] started with ${DefaultWorkerCount} workers`);
  }

  stop(): void {
    this.ctx.cancelled = true;
  }

  async enqueueJob(req: EnqueueJobRequest): Promise<ReportJobDTO> {
    if (!req.organizationID) {
      throw new Error("organization_id is required");
    }
    if (!req.priority) req.priority = "normal";
    if (!req.maxAttempts || req.maxAttempts <= 0) req.maxAttempts = DefaultMaxAttempts;

    const result = await query(
      `INSERT INTO report_jobs
         (organization_id, schedule_id, template_id, status, priority, attempt_count, max_attempts)
       VALUES ($1, $2, $3, 'queued', $4, 0, $5)
       RETURNING id, organization_id, schedule_id, template_id, status, priority,
                 attempt_count, max_attempts, next_retry_at, error_message,
                 created_at, started_at, completed_at`,
      [
        req.organizationID, req.scheduleID || null, req.templateID || null,
        req.priority, req.maxAttempts,
      ]
    );

    return this.mapJobRow(result.rows[0]);
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization_name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  async resolveJobIDByCreatedAt(
    createdAt: Date,
    organizationName: string
  ): Promise<string> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id FROM public.report_jobs
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at < ($2::timestamptz + INTERVAL '1 second')`,
      [orgID, createdAt]
    );
    if (result.rows.length === 0) {
      throw new Error("report job not found");
    }
    return result.rows[0].id;
  }

  async getJobByID(id: string): Promise<ReportJobDTO> {
    const result = await query(
      `SELECT id, organization_id, schedule_id, template_id, status, priority,
              attempt_count, max_attempts, next_retry_at, error_message,
              created_at, started_at, completed_at
       FROM report_jobs
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("report job not found");
    }
    return this.mapJobRow(result.rows[0]);
  }

  async listJobs(
    orgID: string,
    filter?: JobFilter
  ): Promise<[ReportJobDTO[], number]> {
    if (!filter) filter = { limit: 20, offset: 0 };
    if (filter.limit <= 0) filter.limit = 20;

    const args: unknown[] = [orgID];
    let where = "organization_id = $1";

    if (filter.status) {
      args.push(filter.status);
      where += ` AND status = $${args.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM report_jobs WHERE ${where}`,
      args
    );
    const total = parseInt(countResult.rows[0].count, 10);

    args.push(filter.limit, filter.offset);
    const dataResult = await query(
      `SELECT id, organization_id, schedule_id, template_id, status, priority,
              attempt_count, max_attempts, next_retry_at, error_message,
              created_at, started_at, completed_at
       FROM report_jobs
       WHERE ${where}
       ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 END ASC, created_at DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args
    );

    const jobs = dataResult.rows.map((r: any) => this.mapJobRow(r));
    return [jobs, total];
  }

  async retryJob(id: string): Promise<ReportJobDTO> {
    const existing = await this.getJobByID(id);
    if (existing.status !== "failed" && existing.status !== "dead_lettered") {
      throw new Error(
        `job ${id} cannot be retried in status "${existing.status}" (only failed or dead_lettered)`
      );
    }

    const result = await query(
      `UPDATE report_jobs SET
         status        = 'queued',
         attempt_count = 0,
         next_retry_at = NULL,
         error_message = NULL
       WHERE id = $1
       RETURNING id, organization_id, schedule_id, template_id, status, priority,
                 attempt_count, max_attempts, next_retry_at, error_message,
                 created_at, started_at, completed_at`,
      [id]
    );

    return this.mapJobRow(result.rows[0]);
  }

  async queueMetrics(): Promise<QueueMetricsDTO> {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('queued', 'retrying'))     AS queue_depth,
         COUNT(*) FILTER (WHERE status = 'processing')                AS processing_count,
         COUNT(*) FILTER (WHERE status = 'dead_lettered')             AS dlq_size,
         COUNT(*) FILTER (WHERE status IN ('failed','dead_lettered')
                           AND created_at >= NOW() - INTERVAL '1 hour') AS failures_last_hour,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS total_last_hour
       FROM report_jobs`
    );

    const {
      queue_depth, processing_count, dlq_size, failures_last_hour, total_last_hour,
    } = result.rows[0];

    let failureRate = 0;
    if (total_last_hour > 0) {
      failureRate = (failures_last_hour / total_last_hour) * 100;
    }

    return {
      queueDepth: parseInt(queue_depth, 10),
      processingCount: parseInt(processing_count, 10),
      dlqSize: parseInt(dlq_size, 10),
      failureRate,
    };
  }

  backoffDelay(attempt: number): number {
    if (attempt <= 0) return DefaultBaseDelay;
    const multiplier = Math.pow(2, attempt);
    if (isFinite(multiplier) && DefaultBaseDelay * multiplier < DefaultMaxWait) {
      return DefaultBaseDelay * multiplier;
    }
    return DefaultMaxWait;
  }

  private async worker(): Promise<void> {
    while (!this.ctx.cancelled) {
      await this.sleep(workerPollInterval);
      await this.processNextJob();
    }
  }

  private async processNextJob(): Promise<void> {
    try {
      const result = await query(
        `UPDATE report_jobs SET status = 'processing', started_at = NOW()
         WHERE id = (
           SELECT id FROM report_jobs
           WHERE status = 'queued'
           ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 END ASC, created_at ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING id, organization_id, schedule_id, template_id, status, priority,
                   attempt_count, max_attempts, next_retry_at, error_message,
                   created_at, started_at, completed_at`
      );

      if (result.rows.length > 0) {
        const job = this.mapJobRow(result.rows[0]);
        await this.executeJob(job);
      }
    } catch (err: any) {
      console.error(`[ReportJobQueue] worker claim error:`, err.message);
    }
  }

  private async executeJob(job: ReportJobDTO): Promise<void> {
    console.log(
      `[ReportJobQueue] executing job ${job.id} (org=${job.organizationID} priority=${job.priority} attempt=${job.attemptCount + 1}/${job.maxAttempts})`
    );

    try {
      await this.runReportGeneration(job);
      await this.markCompleted(job.id);
      console.log(`[ReportJobQueue] job ${job.id} completed`);
    } catch (err: any) {
      await this.handleJobFailure(job, err.message);
    }
  }

  private async runReportGeneration(job: ReportJobDTO): Promise<void> {
    // Publish event hook — downstream listeners pick up the work
  }

  private async markCompleted(id: string): Promise<void> {
    await query(
      `UPDATE report_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  private async handleJobFailure(job: ReportJobDTO, errMsg: string): Promise<void> {
    const newAttempt = job.attemptCount + 1;

    if (newAttempt >= job.maxAttempts) {
      await this.deadLetterJob(job.id, errMsg);
      return;
    }

    const wait = this.backoffDelay(newAttempt);
    const nextRetry = new Date(Date.now() + wait);

    await query(
      `UPDATE report_jobs SET
         status        = 'retrying',
         attempt_count = $1,
         next_retry_at = $2,
         error_message = $3
       WHERE id = $4`,
      [newAttempt, nextRetry, errMsg, job.id]
    );

    console.log(
      `[ReportJobQueue] job ${job.id} scheduled for retry in ${wait}ms (attempt ${newAttempt}/${job.maxAttempts})`
    );
  }

  private async deadLetterJob(id: string, errMsg: string): Promise<void> {
    await query(
      `UPDATE report_jobs SET
         status        = 'dead_lettered',
         error_message = $1,
         completed_at  = NOW()
       WHERE id = $2`,
      [errMsg, id]
    );
    console.log(`[ReportJobQueue] job ${id} dead-lettered: ${errMsg}`);
  }

  private async retryPoller(): Promise<void> {
    while (!this.ctx.cancelled) {
      await this.sleep(retryPollInterval);
      await this.requeueRetryJobs();
    }
  }

  private async requeueRetryJobs(): Promise<void> {
    const result = await query(
      `UPDATE report_jobs SET status = 'queued', next_retry_at = NULL
       WHERE status = 'retrying' AND next_retry_at <= NOW()`
    );
    if ((result.rowCount ?? 0) > 0) {
      console.log(`[ReportJobQueue] requeued ${result.rowCount} retry job(s)`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapJobRow(row: any): ReportJobDTO {
    return {
      id: row.id,
      organizationID: row.organization_id,
      scheduleID: row.schedule_id,
      templateID: row.template_id,
      status: row.status,
      priority: row.priority,
      attemptCount: parseInt(row.attempt_count, 10),
      maxAttempts: parseInt(row.max_attempts, 10),
      nextRetryAt: row.next_retry_at,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }
}
