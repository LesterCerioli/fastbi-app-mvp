import { query } from "../../db";
import { cadenceToExpression, nextRunTime } from "./cron_evaluator";

export interface ReportScheduleDTO {
  id: string;
  organizationID: string;
  templateID: string | null;
  name: string;
  cronExpression: string;
  timezone: string;
  exportFormat: string;
  language: string;
  distributionListID: string | null;
  isActive: boolean;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledEvent {
  scheduleID: string;
  orgID: string;
  templateID: string | null;
  runAt: Date;
  eventID: string;
}

export interface CreateScheduleRequest {
  organizationName: string;
  templateName?: string | null;
  name: string;
  cronExpression?: string;
  cadence?: string;
  timezone: string;
  exportFormat?: string;
  language?: string;
  distributionListID?: string | null;
  isActive?: boolean | null;
}

export interface UpdateScheduleRequest {
  organizationName: string;
  name?: string | null;
  cronExpression?: string | null;
  cadence?: string | null;
  timezone?: string | null;
  exportFormat?: string | null;
  language?: string | null;
  distributionListID?: string | null;
  isActive?: boolean | null;
}

export interface ScheduleFilter {
  isActive?: boolean;
  limit: number;
  offset: number;
}

export class ReportScheduleService {
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

  async resolveScheduleIDByName(orgID: string, name: string): Promise<string> {
    if (!name) throw new Error("name is required");
    const result = await query(
      `SELECT id FROM public.report_schedules WHERE name = $1 AND organization_id = $2`,
      [name, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error("report schedule not found");
    }
    return result.rows[0].id;
  }

  async resolveTemplateID(orgID: string, templateName: string): Promise<string> {
    if (!templateName) throw new Error("template_name is required");
    const result = await query(
      `SELECT id FROM public.report_templates WHERE name = $1 AND organization_id = $2 AND is_active = TRUE`,
      [templateName, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error(`report template not found: ${templateName}`);
    }
    return result.rows[0].id;
  }

  resolveCronExpression(cronExpr: string, cadence: string): string {
    if (cadence) {
      const expr = cadenceToExpression(cadence);
      if (!expr) {
        throw new Error(`unknown cadence "${cadence}" — use daily, weekly, monthly or quarterly`);
      }
      return expr;
    }
    if (!cronExpr) {
      throw new Error("either cron_expression or cadence is required");
    }
    return cronExpr;
  }

  async createSchedule(req: CreateScheduleRequest): Promise<ReportScheduleDTO> {
    if (!req.name) throw new Error("name is required");
    if (!req.organizationName) throw new Error("organization_name is required");

    const orgID = await this.resolveOrganizationID(req.organizationName);

    let templateID: string | null = null;
    if (req.templateName) {
      templateID = await this.resolveTemplateID(orgID, req.templateName);
    }

    const cronExpr = this.resolveCronExpression(req.cronExpression || "", req.cadence || "");
    const tz = req.timezone || "UTC";
    const exportFormat = req.exportFormat || "pdf";
    const lang = req.language || "en";
    const isActive = req.isActive !== null && req.isActive !== undefined ? req.isActive : true;

    const nextRun = nextRunTime(cronExpr, tz, new Date());

    const result = await query(
      `INSERT INTO report_schedules
         (organization_id, template_id, name, cron_expression, timezone,
          export_format, language, distribution_list_id, is_active, next_run_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, organization_id, template_id, name, cron_expression, timezone,
                 export_format, language, distribution_list_id, is_active,
                 next_run_at, last_run_at, created_at, updated_at`,
      [
        orgID, templateID, req.name, cronExpr, tz,
        exportFormat, lang, req.distributionListID || null, isActive, nextRun,
      ]
    );

    return this.mapScheduleRow(result.rows[0]);
  }

  async listSchedules(
    organizationID: string,
    filter?: ScheduleFilter
  ): Promise<[ReportScheduleDTO[], number]> {
    if (!filter) filter = { limit: 20, offset: 0 };
    if (filter.limit <= 0) filter.limit = 20;

    const args: unknown[] = [organizationID];
    let where = "organization_id = $1";

    if (filter.isActive !== undefined) {
      args.push(filter.isActive);
      where += ` AND is_active = $${args.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM report_schedules WHERE ${where}`,
      args
    );
    const total = parseInt(countResult.rows[0].count, 10);

    args.push(filter.limit, filter.offset);
    const dataResult = await query(
      `SELECT id, organization_id, template_id, name, cron_expression, timezone,
              export_format, language, distribution_list_id, is_active,
              next_run_at, last_run_at, created_at, updated_at
       FROM report_schedules
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args
    );

    const schedules = dataResult.rows.map((r: any) => this.mapScheduleRow(r));
    return [schedules, total];
  }

  async getScheduleByID(id: string): Promise<ReportScheduleDTO> {
    const result = await query(
      `SELECT id, organization_id, template_id, name, cron_expression, timezone,
              export_format, language, distribution_list_id, is_active,
              next_run_at, last_run_at, created_at, updated_at
       FROM report_schedules
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("report schedule not found");
    }
    return this.mapScheduleRow(result.rows[0]);
  }

  async updateSchedule(
    id: string,
    req: UpdateScheduleRequest
  ): Promise<ReportScheduleDTO> {
    const existing = await this.getScheduleByID(id);

    let cronExpr = existing.cronExpression;
    let tz = existing.timezone;

    if (req.cadence) {
      const expr = cadenceToExpression(req.cadence);
      if (!expr) {
        throw new Error(`unknown cadence "${req.cadence}" — use daily, weekly, monthly or quarterly`);
      }
      cronExpr = expr;
    } else if (req.cronExpression) {
      cronExpr = req.cronExpression;
    }

    if (req.timezone) tz = req.timezone;

    const nextRun = nextRunTime(cronExpr, tz, new Date());

    const name = req.name || existing.name;
    const exportFormat = req.exportFormat || existing.exportFormat;
    const lang = req.language || existing.language;
    const distListID = req.distributionListID !== undefined ? req.distributionListID : existing.distributionListID;
    const isActive = req.isActive !== undefined ? req.isActive : existing.isActive;

    const result = await query(
      `UPDATE report_schedules SET
         name                 = $1,
         cron_expression      = $2,
         timezone             = $3,
         export_format        = $4,
         language             = $5,
         distribution_list_id = $6,
         is_active            = $7,
         next_run_at          = $8,
         updated_at           = NOW()
       WHERE id = $9
       RETURNING id, organization_id, template_id, name, cron_expression, timezone,
                 export_format, language, distribution_list_id, is_active,
                 next_run_at, last_run_at, created_at, updated_at`,
      [name, cronExpr, tz, exportFormat, lang, distListID, isActive, nextRun, id]
    );

    if (result.rows.length === 0) {
      throw new Error("report schedule not found");
    }
    return this.mapScheduleRow(result.rows[0]);
  }

  async deleteSchedule(id: string): Promise<void> {
    const result = await query(
      `UPDATE report_schedules SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      throw new Error("report schedule not found");
    }
  }

  async triggerSchedule(id: string): Promise<ScheduledEvent> {
    const sched = await this.getScheduleByID(id);
    const runAt = new Date();
    const eventID = crypto.randomUUID();

    await query(
      `UPDATE report_schedules SET last_run_at = $1, updated_at = NOW() WHERE id = $2`,
      [runAt, id]
    );

    return {
      scheduleID: sched.id,
      orgID: sched.organizationID,
      templateID: sched.templateID,
      runAt,
      eventID,
    };
  }

  private mapScheduleRow(r: any): ReportScheduleDTO {
    return {
      id: r.id,
      organizationID: r.organization_id,
      templateID: r.template_id,
      name: r.name,
      cronExpression: r.cron_expression,
      timezone: r.timezone,
      exportFormat: r.export_format,
      language: r.language,
      distributionListID: r.distribution_list_id,
      isActive: r.is_active,
      nextRunAt: r.next_run_at,
      lastRunAt: r.last_run_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
