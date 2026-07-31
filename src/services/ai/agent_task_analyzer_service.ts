import { query } from "../db";

export interface TaskThroughputRow {
  task_type: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  success_rate_pct: number;
  avg_duration_sec: number;
}

export interface TaskThroughputResult {
  organization_name: string;
  rows: TaskThroughputRow[];
  best_performing_type: string;
  worst_performing_type: string;
}

export interface TaskBacklogBucket {
  priority: number;
  priority_label: string;
  count: number;
  oldest_created_at?: Date;
}

export interface TaskBacklogResult {
  organization_name: string;
  total_pending: number;
  total_in_progress: number;
  priority_buckets: TaskBacklogBucket[];
}

export interface TaskFailureRow {
  task_type: string;
  failed_count: number;
  total_count: number;
  failure_rate_pct: number;
}

export interface TaskFailurePatternResult {
  organization_name: string;
  lookback_days: number;
  rows: TaskFailureRow[];
  highest_failure_type: string;
}

export interface TaskDurationBenchmark {
  task_type: string;
  avg_duration_sec: number;
  min_duration_sec: number;
  max_duration_sec: number;
  sample_count: number;
}

export interface TaskDurationResult {
  organization_name: string;
  benchmarks: TaskDurationBenchmark[];
  slowest_type: string;
  fastest_type: string;
}

function priorityLabel(p: number): string {
  if (p >= 9) return "critical";
  if (p >= 7) return "high";
  if (p >= 4) return "medium";
  return "low";
}

export class AgentTaskAnalyzerService {
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

  async getTaskThroughputByType(orgName: string): Promise<TaskThroughputResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        task_type,
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
        COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
          FILTER (WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL), 0) AS avg_duration_sec
       FROM public.agent_tasks
       WHERE organization_id = $1
       GROUP BY task_type
       ORDER BY total_count DESC`,
      [orgID]
    );

    const rows: TaskThroughputRow[] = result.rows.map((row: any) => ({
      task_type: row.task_type,
      total_count: row.total_count,
      completed_count: row.completed_count,
      failed_count: row.failed_count,
      success_rate_pct: row.total_count > 0 ? (row.completed_count / row.total_count) * 100 : 0,
      avg_duration_sec: row.avg_duration_sec,
    }));

    let best = "", worst = "";
    let bestRate = -1, worstRate = 101;
    for (const r of rows) {
      if (r.total_count >= 5) {
        if (r.success_rate_pct > bestRate) { bestRate = r.success_rate_pct; best = r.task_type; }
        if (r.success_rate_pct < worstRate) { worstRate = r.success_rate_pct; worst = r.task_type; }
      }
    }

    return {
      organization_name: orgName,
      rows,
      best_performing_type: best,
      worst_performing_type: worst,
    };
  }

  async getBacklogAnalysis(orgName: string): Promise<TaskBacklogResult> {
    const orgID = await this.resolveOrg(orgName);

    const rowsResult = await query(
      `SELECT
        priority,
        COUNT(*) AS cnt,
        MIN(created_at) AS oldest
       FROM public.agent_tasks
       WHERE organization_id = $1
         AND status IN ('pending', 'in_progress')
       GROUP BY priority
       ORDER BY priority DESC`,
      [orgID]
    );

    const buckets: TaskBacklogBucket[] = rowsResult.rows.map((row: any) => ({
      priority: row.priority,
      priority_label: priorityLabel(row.priority),
      count: row.cnt,
      oldest_created_at: row.oldest || undefined,
    }));

    const countResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress
       FROM public.agent_tasks WHERE organization_id = $1`,
      [orgID]
    );

    return {
      organization_name: orgName,
      total_pending: countResult.rows[0]?.pending ?? 0,
      total_in_progress: countResult.rows[0]?.in_progress ?? 0,
      priority_buckets: buckets,
    };
  }

  async getTaskFailurePatterns(orgName: string, lookbackDays: number): Promise<TaskFailurePatternResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        task_type,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
        COUNT(*) AS total_count
       FROM public.agent_tasks
       WHERE organization_id = $1
         AND created_at >= NOW() - ($2 || ' days')::interval
       GROUP BY task_type
       HAVING COUNT(*) FILTER (WHERE status = 'failed') > 0
       ORDER BY failed_count DESC`,
      [orgID, lookbackDays]
    );

    const rows: TaskFailureRow[] = result.rows.map((row: any) => ({
      task_type: row.task_type,
      failed_count: row.failed_count,
      total_count: row.total_count,
      failure_rate_pct: row.total_count > 0 ? (row.failed_count / row.total_count) * 100 : 0,
    }));

    return {
      organization_name: orgName,
      lookback_days: lookbackDays,
      rows,
      highest_failure_type: rows.length > 0 ? rows[0].task_type : "",
    };
  }

  async getTaskDurationBenchmarks(orgName: string): Promise<TaskDurationResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        task_type,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_sec,
        MIN(EXTRACT(EPOCH FROM (completed_at - started_at))) AS min_sec,
        MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) AS max_sec,
        COUNT(*) AS sample_count
       FROM public.agent_tasks
       WHERE organization_id = $1
         AND status = 'completed'
         AND started_at IS NOT NULL
         AND completed_at IS NOT NULL
       GROUP BY task_type
       ORDER BY avg_sec DESC`,
      [orgID]
    );

    const benches: TaskDurationBenchmark[] = result.rows;
    const slowest = benches.length > 0 ? benches[0].task_type : "";
    const fastest = benches.length > 0 ? benches[benches.length - 1].task_type : "";

    return {
      organization_name: orgName,
      benchmarks: benches,
      slowest_type: slowest,
      fastest_type: fastest,
    };
  }
}
