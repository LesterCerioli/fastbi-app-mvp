import { query } from "../db";

export interface FeedbackSentimentBucket {
  feedbackType: string;
  count: number;
  actionTakenPct: number;
  avgImpact: number;
}

export interface FeedbackSentimentResult {
  totalFeedback: number;
  positiveRatePct: number;
  negativeRatePct: number;
  overallActionTakenPct: number;
  buckets: FeedbackSentimentBucket[];
}

export interface InsightActionRow {
  insightID: string;
  totalFeedback: number;
  actionTakenPct: number;
  avgImpact: number;
  positivePct: number;
}

export interface InsightActionRateResult {
  topPerformingInsights: InsightActionRow[];
  leastActedOnInsights: InsightActionRow[];
}

export interface AnalysisTypeFrequencyRow {
  analysisType: string;
  count: number;
}

export interface BusinessContextRow {
  businessContext: string;
  count: number;
}

export interface AnalysisResultPatternResult {
  typeFrequency: AnalysisTypeFrequencyRow[];
  contextFrequency: BusinessContextRow[];
  totalResults: number;
  mostCommonType: string;
  mostCommonContext: string;
}

export interface DatasetFormatRow {
  formatType: string;
  count: number;
  avgRows: number;
  avgColumns: number;
}

export interface DatasetProfileSummary {
  totalDatasets: number;
  formatBreakdown: DatasetFormatRow[];
  overallAvgRows: number;
  overallAvgCols: number;
  largestAvgRowsFormat: string;
}

export class FeedbackAnalysisService {
  async getFeedbackSentimentDistribution(): Promise<FeedbackSentimentResult> {
    const result = await query(`
      SELECT
        COALESCE(feedback_type, 'unknown') AS feedback_type,
        COUNT(*) AS cnt,
        ROUND(100.0 * COUNT(*) FILTER (WHERE user_action_taken) / NULLIF(COUNT(*), 0), 2) AS action_taken_pct,
        COALESCE(AVG(actual_impact_observed), 0) AS avg_impact
      FROM public.user_feedback
      GROUP BY feedback_type
      ORDER BY cnt DESC
    `);

    const buckets: FeedbackSentimentBucket[] = [];
    let total = 0;

    for (const row of result.rows) {
      buckets.push({
        feedbackType: row.feedback_type,
        count: Number(row.cnt),
        actionTakenPct: Number(row.action_taken_pct),
        avgImpact: Number(row.avg_impact),
      });
      total += Number(row.cnt);
    }

    const aggResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE user_action_taken) AS action_taken,
        COUNT(*) AS grand_total
      FROM public.user_feedback
    `);
    const actionTakenTotal = Number(aggResult.rows[0]?.action_taken || 0);
    const grandTotal = Number(aggResult.rows[0]?.grand_total || 0);

    const rate = (t: string): number => {
      if (total === 0) return 0;
      const found = buckets.find(b => b.feedbackType === t);
      return found ? (found.count / total) * 100 : 0;
    };

    const overallAction = grandTotal > 0 ? (actionTakenTotal / grandTotal) * 100 : 0;

    return {
      totalFeedback: total,
      positiveRatePct: rate("positive"),
      negativeRatePct: rate("negative"),
      overallActionTakenPct: overallAction,
      buckets,
    };
  }

  async getInsightActionRate(topN: number): Promise<InsightActionRateResult> {
    const result = await query(`
      SELECT
        COALESCE(insight_id, 'unknown') AS insight_id,
        COUNT(*) AS total_feedback,
        ROUND(100.0 * COUNT(*) FILTER (WHERE user_action_taken) / NULLIF(COUNT(*), 0), 2) AS action_taken_pct,
        COALESCE(AVG(actual_impact_observed), 0) AS avg_impact,
        ROUND(100.0 * COUNT(*) FILTER (WHERE feedback_type = 'positive') / NULLIF(COUNT(*), 0), 2) AS positive_pct
      FROM public.user_feedback
      WHERE insight_id IS NOT NULL
      GROUP BY insight_id
      HAVING COUNT(*) >= 2
      ORDER BY action_taken_pct DESC
      LIMIT $1
    `, [topN * 2]);

    const all: InsightActionRow[] = [];
    for (const row of result.rows) {
      all.push({
        insightID: row.insight_id,
        totalFeedback: Number(row.total_feedback),
        actionTakenPct: Number(row.action_taken_pct),
        avgImpact: Number(row.avg_impact),
        positivePct: Number(row.positive_pct),
      });
    }

    const top = all.slice(0, topN);
    const least = all.slice(topN);

    return {
      topPerformingInsights: top,
      leastActedOnInsights: least,
    };
  }

  async getAnalysisResultPatterns(): Promise<AnalysisResultPatternResult> {
    const typeRows = await query(`
      SELECT COALESCE(analysis_type, 'unknown') AS analysis_type, COUNT(*) AS cnt
      FROM public.analysis_results
      GROUP BY analysis_type
      ORDER BY COUNT(*) DESC
    `);

    const types: AnalysisTypeFrequencyRow[] = [];
    let total = 0;
    for (const row of typeRows.rows) {
      types.push({ analysisType: row.analysis_type, count: Number(row.cnt) });
      total += Number(row.cnt);
    }

    const ctxRows = await query(`
      SELECT COALESCE(business_context, 'unknown') AS business_context, COUNT(*) AS cnt
      FROM public.analysis_results
      GROUP BY business_context
      ORDER BY COUNT(*) DESC
    `);

    const contexts: BusinessContextRow[] = [];
    for (const row of ctxRows.rows) {
      contexts.push({ businessContext: row.business_context, count: Number(row.cnt) });
    }

    return {
      typeFrequency: types,
      contextFrequency: contexts,
      totalResults: total,
      mostCommonType: types.length > 0 ? types[0].analysisType : "",
      mostCommonContext: contexts.length > 0 ? contexts[0].businessContext : "",
    };
  }

  async getDatasetProfileSummary(): Promise<DatasetProfileSummary> {
    const result = await query(`
      SELECT
        format_type,
        COUNT(*) AS cnt,
        COALESCE(AVG(rows_count), 0) AS avg_rows,
        COALESCE(AVG(columns_count), 0) AS avg_cols
      FROM public.dataset_metadata
      GROUP BY format_type
      ORDER BY avg_rows DESC
    `);

    const formats: DatasetFormatRow[] = [];
    for (const row of result.rows) {
      formats.push({
        formatType: row.format_type,
        count: Number(row.cnt),
        avgRows: Number(row.avg_rows),
        avgColumns: Number(row.avg_cols),
      });
    }

    const aggResult = await query(`
      SELECT COUNT(*) AS total, COALESCE(AVG(rows_count), 0) AS overall_rows, COALESCE(AVG(columns_count), 0) AS overall_cols
      FROM public.dataset_metadata
    `);

    return {
      totalDatasets: Number(aggResult.rows[0]?.total || 0),
      formatBreakdown: formats,
      overallAvgRows: Number(aggResult.rows[0]?.overall_rows || 0),
      overallAvgCols: Number(aggResult.rows[0]?.overall_cols || 0),
      largestAvgRowsFormat: formats.length > 0 ? formats[0].formatType : "",
    };
  }
}
