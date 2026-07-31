import { query, queryTx } from "../../db";

export const transitionTable: Record<string, string[]> = {
  scheduled: ["queued"],
  queued: ["generating"],
  generating: ["review_pending", "formatting", "failed"],
  review_pending: ["approved", "failed", "generating"],
  approved: ["formatting"],
  formatting: ["exporting", "failed"],
  exporting: ["distributing", "failed"],
  distributing: ["delivered", "failed"],
  failed: ["retrying", "dead_lettered"],
  retrying: ["queued"],
  delivered: [],
  dead_lettered: [],
};

export class ErrInvalidTransition extends Error {
  constructor(from: string, to: string) {
    super(`invalid transition from "${from}" to "${to}"`);
    this.name = "ErrInvalidTransition";
  }
}

export function isInvalidTransition(err: Error): boolean {
  return err instanceof ErrInvalidTransition;
}

export function validateTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new ErrInvalidTransition(from, to);
  }
}

function canTransition(from: string, to: string): boolean {
  const allowed = transitionTable[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export interface CreateRunRequest {
  organizationName: string;
  scheduleName?: string | null;
  jobCreatedAt?: string | null;
  metadata?: Record<string, any>;
}

export interface TransitionRequest {
  toStatus: string;
  metadata?: Record<string, any>;
  errorDetails?: string;
}

export interface RunFilter {
  status?: string;
  limit: number;
  offset: number;
}

export interface ReportRunDTO {
  id: string;
  organizationID: string;
  scheduleID: string | null;
  jobID: string | null;
  status: string;
  currentStage: string;
  stageStartedAt: Date;
  stageMetadata: Record<string, any> | null;
  createdAt: Date;
  deliveredAt: Date | null;
  errorDetails: string | null;
  stageTimeline?: StageEntryDTO[];
}

export interface StageEntryDTO {
  id: string;
  runID: string;
  status: string;
  enteredAt: Date;
  exitedAt: Date | null;
  durationMs: number | null;
  metadata: Record<string, any> | null;
}

export class ReportRunStateMachineService {
  private usageTracker: ((templateID: string) => Promise<void>) | null = null;

  withUsageTracker(tracker: (templateID: string) => Promise<void>): void {
    this.usageTracker = tracker;
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) throw new Error("organization_name is required");
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  async resolveRunIDByCreatedAt(
    createdAt: Date,
    organizationName: string
  ): Promise<string> {
    const orgID = await this.resolveOrganizationID(organizationName);
    return this.resolveRunIDByCreatedAtInner(createdAt, orgID);
  }

  async createRun(req: CreateRunRequest): Promise<ReportRunDTO> {
    if (!req.organizationName) throw new Error("organization_name is required");

    const orgID = await this.resolveOrganizationID(req.organizationName);

    let scheduleID: string | null = null;
    if (req.scheduleName) {
      const result = await query(
        `SELECT id FROM public.report_schedules WHERE name = $1 AND organization_id = $2`,
        [req.scheduleName, orgID]
      );
      if (result.rows.length === 0) {
        throw new Error(`schedule not found: ${req.scheduleName}`);
      }
      scheduleID = result.rows[0].id;
    }

    let jobID: string | null = null;
    if (req.jobCreatedAt) {
      const t = new Date(req.jobCreatedAt);
      const result = await query(
        `SELECT id FROM public.report_jobs
         WHERE organization_id = $1
           AND created_at >= $2
           AND created_at < ($2::timestamptz + INTERVAL '1 second')
         ORDER BY created_at ASC`,
        [orgID, t]
      );
      if (result.rows.length === 0) {
        throw new Error("job not found for the given job_created_at");
      }
      if (result.rows.length > 1) {
        throw new Error("ambiguous: multiple jobs created within the same second; use a more precise timestamp");
      }
      jobID = result.rows[0].id;
    }

    const metaJSON = req.metadata ? JSON.stringify(req.metadata) : null;
    const now = new Date();

    const result = await query(
      `INSERT INTO public.report_runs
         (organization_id, schedule_id, job_id, status, current_stage, stage_started_at, stage_metadata, created_at)
       VALUES ($1, $2, $3, 'scheduled', 'scheduled', $4, $5, $4)
       RETURNING id, organization_id, schedule_id, job_id, status, current_stage,
                 stage_started_at, stage_metadata, created_at, delivered_at, error_details`,
      [orgID, scheduleID, jobID, now, metaJSON]
    );

    const dto = this.mapRunRow(result.rows[0]);
    await this.insertStageEntry(dto.id, "scheduled", now, metaJSON);
    return dto;
  }

  async getRun(id: string, organizationName: string): Promise<ReportRunDTO> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id, organization_id, schedule_id, job_id, status, current_stage,
              stage_started_at, stage_metadata, created_at, delivered_at, error_details
       FROM public.report_runs
       WHERE id = $1 AND organization_id = $2`,
      [id, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error("report run not found");
    }
    const dto = this.mapRunRow(result.rows[0]);
    dto.stageTimeline = await this.loadStageTimeline(id);
    return dto;
  }

  async getRunsByStageStartedAt(
    stageStartedAt: Date,
    organizationName: string
  ): Promise<ReportRunDTO[]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id, organization_id, schedule_id, job_id, status, current_stage,
              stage_started_at, stage_metadata, created_at, delivered_at, error_details
       FROM public.report_runs
       WHERE organization_id = $1
         AND stage_started_at >= $2
         AND stage_started_at < ($2::timestamptz + INTERVAL '1 second')
       ORDER BY stage_started_at ASC`,
      [orgID, stageStartedAt]
    );
    if (result.rows.length === 0) {
      throw new Error("no report runs found for the given stage_started_at");
    }
    const runs: ReportRunDTO[] = [];
    for (const row of result.rows) {
      const dto = this.mapRunRow(row);
      dto.stageTimeline = await this.loadStageTimeline(dto.id);
      runs.push(dto);
    }
    return runs;
  }

  async getRunByCreatedAt(
    createdAt: Date,
    organizationName: string
  ): Promise<ReportRunDTO> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const runID = await this.resolveRunIDByCreatedAtInner(createdAt, orgID);
    return this.getRun(runID, organizationName);
  }

  async approveReviewByCreatedAt(
    createdAt: Date,
    organizationName: string
  ): Promise<ReportRunDTO> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const runID = await this.resolveRunIDByCreatedAtInner(createdAt, orgID);
    return this.transition(runID, organizationName, { toStatus: "approved" });
  }

  async transitionByCreatedAt(
    createdAt: Date,
    organizationName: string,
    req: TransitionRequest
  ): Promise<ReportRunDTO> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const runID = await this.resolveRunIDByCreatedAtInner(createdAt, orgID);
    return this.transition(runID, organizationName, req);
  }

  async transition(
    id: string,
    organizationName: string,
    req: TransitionRequest
  ): Promise<ReportRunDTO> {
    const current = await this.getRun(id, organizationName);

    validateTransition(current.status, req.toStatus);

    const metaJSON = req.metadata ? JSON.stringify(req.metadata) : null;
    const now = new Date();

    let deliveredAt: Date | null = null;
    if (req.toStatus === "delivered") {
      deliveredAt = now;
    }
    const errorDetails = req.errorDetails || null;

    const result = await query(
      `UPDATE public.report_runs SET
         status           = $1,
         current_stage    = $1,
         stage_started_at = $2,
         stage_metadata   = $3,
         delivered_at     = COALESCE($4, delivered_at),
         error_details    = COALESCE($5, error_details)
       WHERE id = $6
       RETURNING id, organization_id, schedule_id, job_id, status, current_stage,
                 stage_started_at, stage_metadata, created_at, delivered_at, error_details`,
      [req.toStatus, now, metaJSON, deliveredAt, errorDetails, id]
    );

    const updated = this.mapRunRow(result.rows[0]);

    await this.closeStageEntry(id, current.status, now);
    await this.insertStageEntry(id, req.toStatus, now, metaJSON);

    await this.incrementTemplateUsage(req);
    updated.stageTimeline = await this.loadStageTimeline(id);

    return updated;
  }

  async approveReview(
    id: string,
    organizationName: string
  ): Promise<ReportRunDTO> {
    return this.transition(id, organizationName, { toStatus: "approved" });
  }

  async listRuns(
    organizationName: string,
    filter?: RunFilter
  ): Promise<[ReportRunDTO[], number]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    if (!filter) filter = { limit: 20, offset: 0 };
    if (filter.limit <= 0) filter.limit = 20;

    const args: unknown[] = [orgID];
    let where = "organization_id = $1";

    if (filter.status) {
      args.push(filter.status);
      where += ` AND status = $${args.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM report_runs WHERE ${where}`,
      args
    );
    const total = parseInt(countResult.rows[0].count, 10);

    args.push(filter.limit, filter.offset);
    const dataResult = await query(
      `SELECT id, organization_id, schedule_id, job_id, status, current_stage,
              stage_started_at, stage_metadata, created_at, delivered_at, error_details
       FROM public.report_runs
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args
    );

    const runs = dataResult.rows.map((r: any) => this.mapRunRow(r));
    return [runs, total];
  }

  private async resolveRunIDByCreatedAtInner(
    createdAt: Date,
    orgID: string
  ): Promise<string> {
    const result = await query(
      `SELECT id FROM public.report_runs
       WHERE organization_id = $1
         AND created_at >= $2
         AND created_at < ($2::timestamptz + INTERVAL '1 second')
       ORDER BY created_at ASC`,
      [orgID, createdAt]
    );
    if (result.rows.length === 0) {
      throw new Error("report run not found");
    }
    if (result.rows.length > 1) {
      throw new Error("ambiguous: multiple runs created within the same second; use a more precise timestamp");
    }
    return result.rows[0].id;
  }

  private async insertStageEntry(
    runID: string,
    status: string,
    enteredAt: Date,
    metaJSON: string | null
  ): Promise<void> {
    await query(
      `INSERT INTO report_run_stages (run_id, status, entered_at, metadata)
       VALUES ($1, $2, $3, $4)`,
      [runID, status, enteredAt, metaJSON]
    );
  }

  private async closeStageEntry(
    runID: string,
    status: string,
    exitedAt: Date
  ): Promise<void> {
    await query(
      `UPDATE public.report_run_stages SET
         exited_at   = $1,
         duration_ms = EXTRACT(EPOCH FROM ($1 - entered_at)) * 1000
       WHERE run_id = $2 AND status = $3 AND exited_at IS NULL
       ORDER BY entered_at DESC
       LIMIT 1`,
      [exitedAt, runID, status]
    );
  }

  private async loadStageTimeline(runID: string): Promise<StageEntryDTO[]> {
    const result = await query(
      `SELECT id, run_id, status, entered_at, exited_at, duration_ms, metadata
       FROM public.report_run_stages
       WHERE run_id = $1
       ORDER BY entered_at ASC`,
      [runID]
    );
    return result.rows.map((r: any) => ({
      id: r.id,
      runID: r.run_id,
      status: r.status,
      enteredAt: r.entered_at,
      exitedAt: r.exited_at,
      durationMs: r.duration_ms,
      metadata: r.metadata,
    }));
  }

  private async incrementTemplateUsage(req: TransitionRequest): Promise<void> {
    if (!this.usageTracker) return;
    if (req.toStatus !== "delivered") return;
    if (!req.metadata || !req.metadata.template_id) return;
    const templateID = req.metadata.template_id as string;
    try {
      await this.usageTracker(templateID);
    } catch (err) {
      console.warn(`[ReportRun] warn: failed to increment usage_count for template ${templateID}:`, err);
    }
  }

  private mapRunRow(r: any): ReportRunDTO {
    return {
      id: r.id,
      organizationID: r.organization_id,
      scheduleID: r.schedule_id,
      jobID: r.job_id,
      status: r.status,
      currentStage: r.current_stage,
      stageStartedAt: r.stage_started_at,
      stageMetadata: r.stage_metadata ? (typeof r.stage_metadata === "string" ? JSON.parse(r.stage_metadata) : r.stage_metadata) : null,
      createdAt: r.created_at,
      deliveredAt: r.delivered_at,
      errorDetails: r.error_details,
    };
  }
}
