import { query } from "../db";
import { AnomalyDetector } from "./anomaly_detector";
import { RootCauseAnalyzer, DimensionBreakdown } from "./root_cause_analyzer";
import { BehavioralMemory, BehavioralPattern } from "./behavioral_memory";
import type { DetectedAnomaly, RootCause } from "./reasoner";

export interface ExecutionResult {
  toolName: string;
  success: boolean;
  output: any;
  error: string;
  durationMs: number;
  metadata: Record<string, any>;
}

export class Executor {
  constructor(
    private anomalyDetector: AnomalyDetector,
    private rootCauseAnalyzer: RootCauseAnalyzer,
    private behavioralMemory: BehavioralMemory
  ) {}

  async executeTool(
    toolName: string,
    params: Record<string, any>,
    orgId: string
  ): Promise<ExecutionResult> {
    const start = Date.now();

    let result: any;
    let err: string | null = null;

    try {
      switch (toolName) {
        case "calculate_growth":
          result = await this.calculateGrowth(orgId, params);
          break;
        case "analyze_by_dimension":
          result = await this.analyzeByDimension(orgId, params);
          break;
        case "root_cause_analysis":
          result = await this.rootCauseAnalysis(orgId, params);
          break;
        case "find_similar_patterns":
          result = await this.findSimilarPatterns(orgId, params);
          break;
        case "detect_anomalies":
          result = await this.detectAnomalies(orgId, params);
          break;
        case "get_current_metrics":
          result = await this.getCurrentMetrics(orgId, params);
          break;
        case "get_historical_data":
          result = await this.getHistoricalData(orgId, params);
          break;
        case "find_growing_dimensions":
          result = await this.findGrowingDimensions(orgId, params);
          break;
        case "seasonality_analysis":
          result = await this.seasonalityAnalysis(orgId, params);
          break;
        case "generate_recommendations":
          result = await this.generateRecommendations(orgId, params);
          break;
        default:
          err = `unknown tool: ${toolName}`;
      }
    } catch (e: any) {
      err = e.message ?? String(e);
    }

    const durationMs = Date.now() - start;

    return {
      toolName,
      success: err === null,
      output: result,
      error: err ?? "",
      durationMs,
      metadata: {},
    };
  }

  private async calculateGrowth(orgId: string, _params: Record<string, any>): Promise<Record<string, any>> {
    const r = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
       FROM public.sales_records
       WHERE organization_id = $1`,
      [orgId]
    );

    const { current, previous } = r.rows[0];
    const growthPercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current: Number(current),
      previous: Number(previous),
      growth_percent: growthPercent,
      absolute_growth: Number(current) - Number(previous),
    };
  }

  private async analyzeByDimension(orgId: string, params: Record<string, any>): Promise<Record<string, any>[]> {
    const dimension = typeof params["dimension"] === "string" ? params["dimension"] : "category";

    const r = await query(
      `SELECT
         ${dimension} as dimension_value,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
       FROM public.sales_records
       WHERE organization_id = $1 AND ${dimension} IS NOT NULL AND ${dimension} != ''
       GROUP BY ${dimension}
       ORDER BY current DESC`,
      [orgId]
    );

    return r.rows.map((row: any) => ({
      dimension: row.dimension_value,
      current: Number(row.current),
      previous: Number(row.previous),
      growth_percent: Number(row.previous) > 0 ? ((Number(row.current) - Number(row.previous)) / Number(row.previous)) * 100 : 0,
    }));
  }

  private async rootCauseAnalysis(orgId: string, _params: Record<string, any>): Promise<RootCause[]> {
    const overallR = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
       FROM public.sales_records
       WHERE organization_id = $1`,
      [orgId]
    );

    const currentTotal = Number(overallR.rows[0].current);
    const previousTotal = Number(overallR.rows[0].previous);

    const categoryR = await query(
      `SELECT
         category,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
       FROM public.sales_records
       WHERE organization_id = $1 AND category IS NOT NULL AND category != ''
       GROUP BY category`,
      [orgId]
    );

    const dimensions: DimensionBreakdown[] = categoryR.rows.map((row: any) => ({
      name: "category",
      value: row.category,
      before: Number(row.previous),
      after: Number(row.current),
    }));

    return this.rootCauseAnalyzer.explainDecline(previousTotal, currentTotal, dimensions);
  }

  private async findSimilarPatterns(orgId: string, params: Record<string, any>): Promise<BehavioralPattern[]> {
    const trigger: Record<string, any> = {};
    if (typeof params["change_percent"] === "number") trigger["change_percent"] = params["change_percent"];
    if (typeof params["dimension"] === "string") trigger["dimension"] = params["dimension"];

    return this.behavioralMemory.findSimilarPatterns(orgId, trigger, 5);
  }

  private async detectAnomalies(orgId: string, _params: Record<string, any>): Promise<DetectedAnomaly[]> {
    const r = await query(
      `SELECT
         DATE_TRUNC('day', date) as day,
         COALESCE(SUM(amount), 0) as total
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '90 days'
       GROUP BY DATE_TRUNC('day', date)
       ORDER BY day ASC`,
      [orgId]
    );

    const values: number[] = r.rows.map((row: any) => Number(row.total));

    const anomalies = this.anomalyDetector.detectZScore(values, 2.5);

    const results: DetectedAnomaly[] = [];
    for (const a of anomalies) {
      results.push({
        metric: "daily_sales",
        dimension: "",
        dimensionValue: "",
        expectedValue: a.expectedValue,
        actualValue: a.value,
        zScore: a.zScore,
        detectedAt: new Date(),
      });

      await this.saveAnomaly(orgId, "daily_sales", "", "", a.expectedValue, a.value, a.zScore);
    }

    return results;
  }

  private async getCurrentMetrics(orgId: string, _params: Record<string, any>): Promise<Record<string, any>> {
    const r = await query(
      `SELECT
         COALESCE(SUM(amount), 0) as total_revenue,
         COUNT(*) as transaction_count,
         COALESCE(AVG(amount), 0) as avg_order_value
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '30 days'`,
      [orgId]
    );

    const metrics = r.rows[0];

    const growthR = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
       FROM public.sales_records
       WHERE organization_id = $1`,
      [orgId]
    );

    const { current, previous } = growthR.rows[0];
    const growthRate = Number(previous) > 0 ? ((Number(current) - Number(previous)) / Number(previous)) * 100 : 0;

    return {
      totalRevenue: Number(metrics.total_revenue),
      transactionCount: Number(metrics.transaction_count),
      averageOrderValue: Number(metrics.avg_order_value),
      growthRate,
      periodLabel: "Last 30 days",
    };
  }

  private async getHistoricalData(orgId: string, params: Record<string, any>): Promise<Record<string, any>[]> {
    const months = typeof params["months"] === "number" ? params["months"] : 12;

    const r = await query(
      `SELECT
         DATE_TRUNC('month', date) as month,
         COALESCE(SUM(amount), 0) as total
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month ASC`,
      [orgId]
    );

    return r.rows.map((row: any) => ({
      period: this.formatMonth(row.month),
      value: Number(row.total),
    }));
  }

  private async findGrowingDimensions(orgId: string, params: Record<string, any>): Promise<Record<string, any>[]> {
    const dimension = typeof params["dimension"] === "string" ? params["dimension"] : "category";

    const r = await query(
      `SELECT
         ${dimension} as dim_value,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
       FROM public.sales_records
       WHERE organization_id = $1 AND ${dimension} IS NOT NULL AND ${dimension} != ''
       GROUP BY ${dimension}
       HAVING COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) > 0
       ORDER BY ((current - previous) / previous) DESC
       LIMIT 5`,
      [orgId]
    );

    return r.rows.map((row: any) => ({
      dimension: row.dim_value,
      current: Number(row.current),
      previous: Number(row.previous),
      growth_percent: Number(row.previous) > 0 ? ((Number(row.current) - Number(row.previous)) / Number(row.previous)) * 100 : 0,
    }));
  }

  private async seasonalityAnalysis(orgId: string, _params: Record<string, any>): Promise<Record<string, any>> {
    const r = await query(
      `SELECT
         EXTRACT(MONTH FROM date) as month,
         AVG(amount) as avg_revenue
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '24 months'
       GROUP BY EXTRACT(MONTH FROM date)
       ORDER BY month`,
      [orgId]
    );

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const seasonal: Record<string, number> = {};

    for (const row of r.rows) {
      const monthIdx = Number(row.month);
      if (monthIdx >= 1 && monthIdx <= 12) {
        seasonal[months[monthIdx - 1]] = Number(row.avg_revenue);
      }
    }

    let peakMonth = "";
    let lowMonth = "";
    let peakValue = 0;
    let lowValue = 0;

    for (const [month, value] of Object.entries(seasonal)) {
      if (value > peakValue) {
        peakValue = value;
        peakMonth = month;
      }
      if (lowValue === 0 || value < lowValue) {
        lowValue = value;
        lowMonth = month;
      }
    }

    return {
      seasonal_pattern: seasonal,
      peak_month: peakMonth,
      peak_value: peakValue,
      low_month: lowMonth,
      low_value: lowValue,
    };
  }

  private async generateRecommendations(orgId: string, params: Record<string, any>): Promise<string[]> {
    const metrics = await this.getCurrentMetrics(orgId, params);
    const growthRate = metrics["growthRate"] as number;

    const recommendations: string[] = [];

    if (growthRate > 10) {
      recommendations.push(
        "Accelerate investment in high-performing channels",
        "Increase inventory for top products",
        "Expand marketing budget for growing categories"
      );
    } else if (growthRate < -10) {
      recommendations.push(
        "Review pricing strategy for declining categories",
        "Launch promotional campaigns for underperforming segments",
        "Analyze competitive landscape for root causes"
      );
    } else if (growthRate < 0) {
      recommendations.push(
        "Monitor declining segments closely",
        "Test targeted promotions in weak areas",
        "Review customer feedback for friction points"
      );
    } else {
      recommendations.push(
        "Maintain current strategy",
        "Look for incremental optimization opportunities",
        "Prepare for seasonal peaks based on historical patterns"
      );
    }

    return recommendations;
  }

  private async saveAnomaly(
    orgId: string,
    metricName: string,
    dimensionName: string,
    dimensionValue: string,
    expectedValue: number,
    actualValue: number,
    zscore: number
  ): Promise<void> {
    await query(
      `INSERT INTO public.agent_anomalies (organization_id, metric_name, dimension_name, dimension_value, expected_value, actual_value, deviation_zscore)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, metricName, dimensionName, dimensionValue, expectedValue, actualValue, zscore]
    );
  }

  private formatMonth(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
}
