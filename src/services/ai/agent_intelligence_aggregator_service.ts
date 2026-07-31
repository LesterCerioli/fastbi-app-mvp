import { query } from "../db";

export interface EffectivePattern {
  id: string;
  trigger_signature: string;
  action_taken: string;
  outcome_success: number;
  effectiveness_score: number;
  last_used_at: Date;
}

export interface EffectivePatternResult {
  patterns: EffectivePattern[];
  generated_at: Date;
}

export interface InsightEffectivenessRank {
  insight_type: string;
  insight_title: string;
  times_given: number;
  positive_feedback: number;
  negative_feedback: number;
  avg_effectiveness_score: number;
  positive_feedback_rate: number;
}

export interface InsightEffectivenessRankResult {
  rankings: InsightEffectivenessRank[];
  generated_at: Date;
}

export interface AnomalySeverityBucket {
  severity: string;
  count: number;
  resolved: number;
  open_count: number;
}

export interface AnomalySeverityDistribution {
  buckets: AnomalySeverityBucket[];
  total_open: number;
  generated_at: Date;
}

export interface LearningConfidenceBucket {
  confidence_band: string;
  pattern_count: number;
  avg_confidence: number;
}

export interface LearningConfidenceDistribution {
  buckets: LearningConfidenceBucket[];
  overall_avg_confidence: number;
  generated_at: Date;
}

export interface OrgHealthScore {
  organization_name: string;
  health_score: number;
  last_total_revenue: number;
  last_total_transactions: number;
  last_avg_margin: number;
  analysis_date: Date;
  insights_generated: number;
  risks_identified: number;
}

export interface InsightSeverityAggregation {
  severity: string;
  count: number;
  dismissed_count: number;
}

export interface ActiveInsightSummary {
  organization_name: string;
  by_severity: InsightSeverityAggregation[];
  total_active: number;
  generated_at: Date;
}

export class AgentIntelligenceAggregatorService {
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

  async getTopEffectivePatterns(orgName: string, limit = 10): Promise<EffectivePatternResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT id::text, trigger_signature, action_taken, outcome_success, effectiveness_score, last_used_at
       FROM public.agent_patterns
       WHERE organization_id = $1
         AND effectiveness_score > 0
       ORDER BY effectiveness_score DESC
       LIMIT $2`,
      [orgID, limit]
    );

    return {
      patterns: result.rows,
      generated_at: new Date(),
    };
  }

  async getInsightEffectivenessRanking(): Promise<InsightEffectivenessRankResult> {
    const result = await query(
      `SELECT
        insight_type,
        insight_title,
        times_given,
        positive_feedback,
        negative_feedback,
        avg_effectiveness_score
       FROM public.insight_effectiveness
       WHERE times_given > 0
       ORDER BY avg_effectiveness_score DESC
       LIMIT 50`
    );

    const rankings: InsightEffectivenessRank[] = result.rows.map((row: any) => ({
      ...row,
      positive_feedback_rate: row.times_given > 0
        ? (row.positive_feedback / row.times_given) * 100
        : 0,
    }));

    return { rankings, generated_at: new Date() };
  }

  async getAnomalySeverityDistribution(orgName: string): Promise<AnomalySeverityDistribution> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        CASE
          WHEN deviation_zscore > 3 THEN 'critical'
          WHEN deviation_zscore > 2 THEN 'high'
          ELSE 'moderate'
        END AS severity,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved
       FROM public.agent_anomalies
       WHERE organization_id = $1
       GROUP BY severity
       ORDER BY severity`,
      [orgID]
    );

    const dist: AnomalySeverityDistribution = { buckets: [], total_open: 0, generated_at: new Date() };
    for (const row of result.rows) {
      const openCount = row.total - row.resolved;
      dist.total_open += openCount;
      dist.buckets.push({ severity: row.severity, count: row.total, resolved: row.resolved, open_count: openCount });
    }

    return dist;
  }

  async getLearningPatternConfidenceDistribution(): Promise<LearningConfidenceDistribution> {
    const result = await query(
      `SELECT
        CASE
          WHEN confidence_score < 0.25 THEN '0-25'
          WHEN confidence_score < 0.50 THEN '25-50'
          WHEN confidence_score < 0.75 THEN '50-75'
          ELSE '75-100'
        END AS band,
        COUNT(*) AS cnt,
        COALESCE(AVG(confidence_score), 0) AS avg_conf
       FROM public.learning_patterns
       WHERE confidence_score IS NOT NULL
       GROUP BY band
       ORDER BY band`
    );

    const dist: LearningConfidenceDistribution = { buckets: [], overall_avg_confidence: 0, generated_at: new Date() };
    let totalConf = 0;
    let totalCount = 0;

    for (const row of result.rows) {
      const b: LearningConfidenceBucket = {
        confidence_band: row.band,
        pattern_count: row.cnt,
        avg_confidence: row.avg_conf,
      };
      totalConf += b.avg_confidence * b.pattern_count;
      totalCount += b.pattern_count;
      dist.buckets.push(b);
    }

    if (totalCount > 0) {
      dist.overall_avg_confidence = totalConf / totalCount;
    }

    return dist;
  }

  async getOrganizationHealthScore(orgName: string): Promise<OrgHealthScore> {
    if (!orgName) throw new Error("organization_name is required");

    const result = await query(
      `SELECT
        COALESCE(health_score, 0) health_score,
        COALESCE(total_revenue, 0) total_revenue,
        COALESCE(total_transactions, 0) total_transactions,
        COALESCE(avg_margin, 0) avg_margin,
        analysis_date,
        COALESCE(jsonb_array_length(insights_generated), 0) insights_generated,
        COALESCE(jsonb_array_length(risks_identified), 0) risks_identified
       FROM public.analysis_history
       WHERE organization_name = $1
       ORDER BY analysis_date DESC
       LIMIT 1`,
      [orgName]
    );

    if (!result.rows[0]) {
      throw new Error(`no analysis history found for organization: ${orgName}`);
    }

    return { organization_name: orgName, ...result.rows[0] };
  }

  async getActiveInsightSummary(orgName: string): Promise<ActiveInsightSummary> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        severity,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_dismissed = true) AS dismissed
       FROM public.agent_insights
       WHERE organization_id = $1
       GROUP BY severity
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           ELSE 4
         END`,
      [orgID]
    );

    const summary: ActiveInsightSummary = {
      organization_name: orgName,
      by_severity: [],
      total_active: 0,
      generated_at: new Date(),
    };

    for (const row of result.rows) {
      summary.total_active += row.total - row.dismissed;
      summary.by_severity.push({
        severity: row.severity,
        count: row.total,
        dismissed_count: row.dismissed,
      });
    }

    return summary;
  }
}
