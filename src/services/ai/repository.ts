import { query } from "../db";

export interface BehavioralPatternRow {
  id: string;
  triggerSignature: string;
  actionTaken: string;
  outcomeSuccess: number;
  effectiveness: number;
}

export interface InsightRow {
  type: string;
  severity: string;
  title: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface AnomalyRow {
  metric: string;
  dimension: string;
  dimensionValue: string;
  expectedValue: number;
  actualValue: number;
  zScore: number;
  detectedAt: Date;
}

export class AgentRepository {
  async savePattern(
    orgId: string,
    triggerSignature: string,
    actionTaken: string,
    outcomeSuccess: number,
    effectiveness: number
  ): Promise<void> {
    await query(
      `INSERT INTO public.agent_patterns (organization_id, trigger_signature, action_taken, outcome_success, effectiveness_score)
       VALUES ($1, $2, $3, $4, $5)`,
      [orgId, triggerSignature, actionTaken, outcomeSuccess, effectiveness]
    );
  }

  async findSimilarPatterns(
    orgId: string,
    triggerSignature: string,
    limit: number
  ): Promise<BehavioralPatternRow[]> {
    const result = await query(
      `SELECT id, trigger_signature, action_taken, outcome_success, effectiveness_score
       FROM public.agent_patterns
       WHERE organization_id = $1
         AND trigger_signature LIKE $2
         AND effectiveness_score > 0
       ORDER BY effectiveness_score DESC
       LIMIT $3`,
      [orgId, `%${triggerSignature}%`, limit]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      triggerSignature: row.trigger_signature,
      actionTaken: row.action_taken,
      outcomeSuccess: row.outcome_success,
      effectiveness: row.effectiveness_score,
    }));
  }

  async saveInsight(
    orgId: string,
    insightType: string,
    severity: string,
    title: string,
    description: string,
    confidence: number,
    metadata: Record<string, any>
  ): Promise<void> {
    const metadataJSON = JSON.stringify(metadata ?? {});
    await query(
      `INSERT INTO public.agent_insights (organization_id, insight_type, severity, title, description, confidence, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, insightType, severity, title, description, confidence, metadataJSON]
    );
  }

  async saveAnomaly(
    orgId: string,
    metricName: string,
    dimensionName: string,
    dimensionValue: string,
    expectedValue: number,
    actualValue: number,
    zscore: number
  ): Promise<void> {
    await query(
      `INSERT INTO agent_anomalies (organization_id, metric_name, dimension_name, dimension_value, expected_value, actual_value, deviation_zscore)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, metricName, dimensionName, dimensionValue, expectedValue, actualValue, zscore]
    );
  }

  async getPendingInsights(orgId: string, limit: number): Promise<InsightRow[]> {
    const result = await query(
      `SELECT insight_type, severity, title, description, confidence, metadata, created_at
       FROM public.agent_insights
       WHERE organization_id = $1 AND is_dismissed = FALSE
       ORDER BY created_at DESC
       LIMIT $2`,
      [orgId, limit]
    );

    return result.rows.map((row: any) => ({
      type: row.insight_type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      confidence: row.confidence,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    }));
  }

  async getPendingAnomalies(orgId: string, limit: number): Promise<AnomalyRow[]> {
    const result = await query(
      `SELECT metric_name, dimension_name, dimension_value, expected_value, actual_value, deviation_zscore, detected_at
       FROM public.agent_anomalies
       WHERE organization_id = $1 AND resolved_at IS NULL
       ORDER BY deviation_zscore DESC, detected_at DESC
       LIMIT $2`,
      [orgId, limit]
    );

    return result.rows.map((row: any) => ({
      metric: row.metric_name,
      dimension: row.dimension_name ?? "",
      dimensionValue: row.dimension_value ?? "",
      expectedValue: row.expected_value,
      actualValue: row.actual_value,
      zScore: row.deviation_zscore,
      detectedAt: row.detected_at,
    }));
  }
}
