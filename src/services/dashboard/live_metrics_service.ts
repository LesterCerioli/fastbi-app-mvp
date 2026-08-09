import { query } from "../db";

export interface LiveKpiValue {
  kpi_id: string;
  actual_value: number;
  target_value: number;
  variance_percentage: number;
  achieved_target: boolean;
  code: string;
  name: string;
}

export interface LiveInsight {
  id: string;
  insight_type: string;
  severity: string;
  title: string;
  description: string;
  confidence: number;
  created_at: Date;
}

export class LiveMetricsService {
  async getKpiValues(organizationName: string): Promise<LiveKpiValue[]> {
    const result = await query(
      `SELECT kv.kpi_id, kv.actual_value, kv.target_value, kv.variance_percentage, kv.achieved_target, k.code, k.name
       FROM public.kpi_values kv
       JOIN public.kpis k ON k.id = kv.kpi_id
       WHERE kv.organization_id = (SELECT id FROM public.organizations WHERE name = $1)
       ORDER BY kv.calculation_date DESC
       LIMIT 20`,
      [organizationName]
    );
    return result.rows;
  }

  async getInsights(organizationName: string): Promise<LiveInsight[]> {
    const result = await query(
      `SELECT id, insight_type, severity, title, description, confidence, created_at
       FROM public.agent_insights
       WHERE organization_id = (SELECT id FROM public.organizations WHERE name = $1)
         AND is_dismissed = false
       ORDER BY created_at DESC
       LIMIT 10`,
      [organizationName]
    );
    return result.rows;
  }
}

export const liveMetricsService = new LiveMetricsService();