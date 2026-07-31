import { query } from "../db";

export interface FleetStatusCount {
  status: string;
  count: number;
}

export interface FleetUtilizationResult {
  organization_name: string;
  status_counts: FleetStatusCount[];
  total_workflows: number;
  active_rate_pct: number;
  overdue_rate_pct: number;
  completion_rate_pct: number;
}

export interface OverdueRental {
  workflow_id: string;
  name: string;
  status: string;
  rental_end_date?: Date;
  overdue_days: number;
  customer_id?: string;
}

export interface OverdueRentalResult {
  organization_name: string;
  count: number;
  rentals: OverdueRental[];
}

export interface RentalDurationStats {
  avg_duration_days: number;
  min_duration_days: number;
  max_duration_days: number;
  sample_count: number;
}

export interface RentalDurationResult {
  organization_name: string;
  lookback_days: number;
  overall: RentalDurationStats;
}

export interface AutomotiveStatusDetail {
  status: string;
  count: number;
  avg_duration_sec: number;
}

export interface AutomotiveStatusComparisonResult {
  organization_name: string;
  rows: AutomotiveStatusDetail[];
}

export class AutomotiveWorkflowAnalyzerService {
  private async resolveOrg(name: string): Promise<string> {
    if (!name) throw new Error("organization_name is required");
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [name]
    );
    if (!result.rows[0]) {
      throw new Error(`organization not found: ${name}`);
    }
    return result.rows[0].id;
  }

  async getFleetUtilizationStatus(orgName: string): Promise<FleetUtilizationResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT status, COUNT(*) AS cnt
       FROM public.automotive_workflows
       WHERE organization_id = $1
       GROUP BY status
       ORDER BY cnt DESC`,
      [orgID]
    );

    const counts: FleetStatusCount[] = result.rows;
    const total = counts.reduce((s: number, c: FleetStatusCount) => s + c.count, 0);
    const statusMap: Record<string, number> = {};
    for (const c of counts) statusMap[c.status] = c.count;

    const rate = (s: string) => (total > 0 ? ((statusMap[s] || 0) / total) * 100 : 0);

    return {
      organization_name: orgName,
      status_counts: counts,
      total_workflows: total,
      active_rate_pct: rate("active"),
      overdue_rate_pct: rate("overdue"),
      completion_rate_pct: rate("completed"),
    };
  }

  async getOverdueRentals(orgName: string): Promise<OverdueRentalResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        id::text,
        name,
        status,
        rental_end_date,
        EXTRACT(EPOCH FROM (NOW() - rental_end_date)) / 86400 AS overdue_days,
        customer_id::text
       FROM public.automotive_workflows
       WHERE organization_id = $1
         AND (
           status = 'overdue'
           OR (status = 'active' AND rental_end_date IS NOT NULL AND rental_end_date < NOW())
         )
       ORDER BY overdue_days DESC`,
      [orgID]
    );

    return {
      organization_name: orgName,
      count: result.rows.length,
      rentals: result.rows,
    };
  }

  async getRentalDurationPatterns(orgName: string, lookbackDays: number): Promise<RentalDurationResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(rental_end_date, completed_at) - rental_start_date)) / 86400), 0) AS avg_duration_days,
        COALESCE(MIN(EXTRACT(EPOCH FROM (COALESCE(rental_end_date, completed_at) - rental_start_date)) / 86400), 0) AS min_duration_days,
        COALESCE(MAX(EXTRACT(EPOCH FROM (COALESCE(rental_end_date, completed_at) - rental_start_date)) / 86400), 0) AS max_duration_days,
        COUNT(*) AS sample_count
       FROM public.automotive_workflows
       WHERE organization_id = $1
         AND rental_start_date IS NOT NULL
         AND (rental_end_date IS NOT NULL OR completed_at IS NOT NULL)
         AND created_at >= NOW() - ($2 || ' days')::interval`,
      [orgID, lookbackDays]
    );

    return {
      organization_name: orgName,
      lookback_days: lookbackDays,
      overall: result.rows[0],
    };
  }

  async compareCompletionByStatus(orgName: string): Promise<AutomotiveStatusComparisonResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        status,
        COUNT(*) AS cnt,
        COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
          FILTER (WHERE started_at IS NOT NULL AND completed_at IS NOT NULL), 0) AS avg_duration_sec
       FROM public.automotive_workflows
       WHERE organization_id = $1
       GROUP BY status
       ORDER BY cnt DESC`,
      [orgID]
    );

    return {
      organization_name: orgName,
      rows: result.rows.map((r: any) => ({
        status: r.status,
        count: r.cnt,
        avg_duration_sec: r.avg_duration_sec,
      })),
    };
  }
}
