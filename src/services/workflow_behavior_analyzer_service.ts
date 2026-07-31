import { query } from "./db";

export interface WorkflowStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface WorkflowStatusReport {
  domain: string;
  statuses: WorkflowStatusCount[];
  total: number;
  completedPct: number;
  avgDurationHours: number;
  generatedAt: Date;
}

export interface BlockedWorkflow {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  daysPending: number;
  fiscalYear?: number;
  fiscalPeriod?: string;
}

export interface BlockedWorkflowResult {
  workflows: BlockedWorkflow[];
  totalBlocked: number;
  generatedAt: Date;
}

export interface PeriodCompletionRate {
  period: string;
  total: number;
  completed: number;
  completedPct: number;
}

export interface WorkflowCompletionComparison {
  domain: string;
  periods: PeriodCompletionRate[];
  bestPeriod: string;
  generatedAt: Date;
}

export class WorkflowBehaviorAnalyzerService {
  private async resolveOrg(orgName: string): Promise<string> {
    if (!orgName) throw new Error("organization_name is required");
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [orgName]);
    if (!result.rows[0]) throw new Error(`organization not found: ${orgName}`);
    return result.rows[0].id;
  }

  async getAccountingWorkflowStatus(orgName: string, fiscalYear?: number): Promise<WorkflowStatusReport> {
    const orgID = await this.resolveOrg(orgName);

    const params: unknown[] = [orgID];
    let where = "organization_id = $1";
    if (fiscalYear && fiscalYear > 0) {
      params.push(fiscalYear);
      where += ` AND fiscal_year = $${params.length}`;
    }

    const result = await query(`
      SELECT status, COUNT(*) AS cnt
      FROM public.accounting_workflows
      WHERE ${where}
      GROUP BY status
    `, params);

    const report: WorkflowStatusReport = {
      domain: "accounting",
      statuses: [],
      total: 0,
      completedPct: 0,
      avgDurationHours: 0,
      generatedAt: new Date(),
    };

    const statuses: WorkflowStatusCount[] = [];
    for (const row of result.rows) {
      statuses.push({ status: row.status, count: Number(row.cnt), percentage: 0 });
      report.total += Number(row.cnt);
    }

    for (const s of statuses) {
      if (report.total > 0) {
        s.percentage = (s.count / report.total) * 100;
      }
      if (s.status === "completed") {
        report.completedPct = s.percentage;
      }
    }
    report.statuses = statuses;

    const durResult = await query(`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600), 0) AS avg_hours
      FROM public.accounting_workflows
      WHERE ${where} AND completed_at IS NOT NULL AND started_at IS NOT NULL
    `, params);

    report.avgDurationHours = Number(durResult.rows[0]?.avg_hours || 0);

    return report;
  }

  async getSalesWorkflowStatus(orgName: string): Promise<WorkflowStatusReport> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT status, COUNT(*) AS cnt
      FROM public.sales_workflows
      WHERE organization_id = $1
      GROUP BY status
    `, [orgID]);

    const report: WorkflowStatusReport = {
      domain: "sales",
      statuses: [],
      total: 0,
      completedPct: 0,
      avgDurationHours: 0,
      generatedAt: new Date(),
    };

    const statuses: WorkflowStatusCount[] = [];
    for (const row of result.rows) {
      statuses.push({ status: row.status, count: Number(row.cnt), percentage: 0 });
      report.total += Number(row.cnt);
    }

    for (const s of statuses) {
      if (report.total > 0) {
        s.percentage = (s.count / report.total) * 100;
      }
      if (s.status === "active") {
        report.completedPct = s.percentage;
      }
    }
    report.statuses = statuses;

    return report;
  }

  async identifyBlockedWorkflows(orgName: string, pendingThresholdDays = 7): Promise<BlockedWorkflowResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        id::text,
        name,
        status,
        created_at,
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS days_pending,
        fiscal_year,
        fiscal_period
      FROM public.accounting_workflows
      WHERE organization_id = $1
        AND status IN ('pending', 'started')
        AND EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 > $2
      ORDER BY days_pending DESC
    `, [orgID, pendingThresholdDays]);

    const workflows: BlockedWorkflow[] = [];
    for (const row of result.rows) {
      workflows.push({
        id: row.id,
        name: row.name,
        status: row.status,
        createdAt: row.created_at,
        daysPending: Math.floor(Number(row.days_pending)),
        fiscalYear: row.fiscal_year ? Number(row.fiscal_year) : undefined,
        fiscalPeriod: row.fiscal_period || undefined,
      });
    }

    return {
      workflows,
      totalBlocked: workflows.length,
      generatedAt: new Date(),
    };
  }

  async compareAccountingWorkflowCompletionByYear(
    orgName: string,
    years: number[],
  ): Promise<WorkflowCompletionComparison> {
    if (years.length === 0) throw new Error("at least one fiscal year is required");

    const orgID = await this.resolveOrg(orgName);

    const result: WorkflowCompletionComparison = {
      domain: "accounting",
      periods: [],
      bestPeriod: "",
      generatedAt: new Date(),
    };

    let bestPct = -1;

    for (const year of years) {
      const rowResult = await query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed
        FROM public.accounting_workflows
        WHERE organization_id = $1 AND fiscal_year = $2
      `, [orgID, year]);

      const row = rowResult.rows[0];
      if (!row) continue;

      const total = Number(row.total);
      const completed = Number(row.completed);
      const pct = total > 0 ? (completed / total) * 100 : 0;

      const pr: PeriodCompletionRate = {
        period: String(year),
        total,
        completed,
        completedPct: pct,
      };
      result.periods.push(pr);

      if (pct > bestPct) {
        bestPct = pct;
        result.bestPeriod = pr.period;
      }
    }

    return result;
  }
}
