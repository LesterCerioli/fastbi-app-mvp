import { query } from "../../db";

export interface KBDocument {
  sourceRef: string;
  content: string;
  score: number;
}

export interface RetrievedContext {
  kbDocuments: KBDocument[];
  numericData: Record<string, number>;
  period: string;
}

export class ContextRetriever {
  async retrieve(
    orgID: string,
    queryHint: string,
    sectionType: string,
    topK: number,
    lookbackDays: number
  ): Promise<RetrievedContext> {
    if (topK <= 0) topK = 10;
    if (lookbackDays <= 0) lookbackDays = 30;

    const kbDocs = await this.fetchKBDocuments(orgID, queryHint, topK);

    const numericData: Record<string, number> = {};

    switch (sectionType) {
      case "revenue":
      case "executive":
      case "summary":
        await this.loadSalesMetrics(orgID, lookbackDays, numericData);
        break;
      case "kpi":
        await this.loadKPIMetrics(orgID, numericData);
        break;
      case "trend":
        await this.loadSalesMetrics(orgID, lookbackDays, numericData);
        await this.loadKPIMetrics(orgID, numericData);
        break;
      case "anomaly":
        await this.loadAnomalyMetrics(orgID, numericData);
        break;
      default:
        await this.loadSalesMetrics(orgID, lookbackDays, numericData);
        await this.loadKPIMetrics(orgID, numericData);
        break;
    }

    return {
      kbDocuments: kbDocs,
      numericData,
      period: `last_${lookbackDays}_days`,
    };
  }

  async fetchKBDocuments(
    orgID: string,
    queryHint: string,
    topK: number
  ): Promise<KBDocument[]> {
    const result = await query(
      `SELECT source_ref, content
       FROM public.report_knowledge_base
       WHERE organization_id = $1
       ORDER BY last_indexed_at DESC
       LIMIT 300`,
      [orgID]
    );

    const candidates: { source_ref: string; content: string }[] = result.rows;
    if (candidates.length === 0) return [];

    const scored = candidates.map((c) => ({
      doc: { sourceRef: c.source_ref, content: c.content, score: 0 },
      score: this.computeSimilarity(queryHint, c.content),
    }));

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.min(topK, scored.length));

    return top.map((s) => ({
      sourceRef: s.doc.sourceRef,
      content: s.doc.content,
      score: s.score,
    }));
  }

  async loadSalesMetrics(
    orgID: string,
    lookbackDays: number,
    out: Record<string, number>
  ): Promise<void> {
    const result = await query(
      `SELECT
         COALESCE(SUM(amount), 0) AS total,
         COUNT(*) AS count,
         COALESCE(AVG(amount), 0) AS avg
       FROM public.sales_records
       WHERE organization_id = $1
         AND date >= NOW() - INTERVAL '${lookbackDays} days'`,
      [orgID]
    );

    if (result.rows.length > 0) {
      const { total, count, avg } = result.rows[0];
      out["sales_records:total_revenue"] = parseFloat(total);
      out["sales_records:transaction_count"] = parseFloat(count);
      out["sales_records:avg_order_value"] = parseFloat(avg);
    }

    const prevResult = await query(
      `SELECT COALESCE(SUM(amount), 0) AS prev
       FROM public.sales_records
       WHERE organization_id = $1
         AND date >= NOW() - INTERVAL '${lookbackDays * 2} days'
         AND date < NOW() - INTERVAL '${lookbackDays} days'`,
      [orgID]
    );

    const prev = prevResult.rows.length > 0 ? parseFloat(prevResult.rows[0].prev) : 0;
    out["sales_records:prev_total_revenue"] = prev;

    const totalRevenue = out["sales_records:total_revenue"] || 0;
    if (prev > 0) {
      out["sales_records:growth_pct"] = ((totalRevenue - prev) / prev) * 100;
    }

    const catResult = await query(
      `SELECT category, COALESCE(SUM(amount), 0) AS rev
       FROM public.sales_records
       WHERE organization_id = $1
         AND category IS NOT NULL
         AND date >= NOW() - INTERVAL '${lookbackDays} days'
       GROUP BY category
       ORDER BY rev DESC
       LIMIT 5`,
      [orgID]
    );

    for (const row of catResult.rows) {
      out[`sales_records:category:${row.category}:revenue`] = parseFloat(row.rev);
    }
  }

  async loadKPIMetrics(
    orgID: string,
    out: Record<string, number>
  ): Promise<void> {
    const result = await query(
      `SELECT k.code, kv.actual_value, kv.target_value, kv.variance_percentage
       FROM public.kpi_values kv
       JOIN public.kpis k ON k.id = kv.kpi_id
       WHERE kv.organization_id = $1
         AND kv.calculation_date = (
           SELECT MAX(calculation_date)
           FROM public.kpi_values
           WHERE organization_id = $1 AND kpi_id = kv.kpi_id
         )
       LIMIT 20`,
      [orgID]
    );

    for (const row of result.rows) {
      out[`kpis:${row.code}:actual_value`] = parseFloat(row.actual_value);
      if (row.target_value != null) {
        out[`kpis:${row.code}:target_value`] = parseFloat(row.target_value);
      }
      if (row.variance_percentage != null) {
        out[`kpis:${row.code}:variance_pct`] = parseFloat(row.variance_percentage);
      }
    }
  }

  async loadAnomalyMetrics(
    orgID: string,
    out: Record<string, number>
  ): Promise<void> {
    const result = await query(
      `SELECT metric_name, expected_value, actual_value, deviation_zscore
       FROM public.agent_anomalies
       WHERE organization_id = $1
         AND resolved_at IS NULL
       ORDER BY deviation_zscore DESC
       LIMIT 10`,
      [orgID]
    );

    for (const row of result.rows) {
      out[`agent_anomalies:${row.metric_name}:expected`] = parseFloat(row.expected_value);
      out[`agent_anomalies:${row.metric_name}:actual`] = parseFloat(row.actual_value);
      out[`agent_anomalies:${row.metric_name}:zscore`] = parseFloat(row.deviation_zscore);
    }
  }

  private computeSimilarity(a: string, b: string): number {
    const wordsA = a.toLowerCase().split(/\W+/);
    const wordsB = b.toLowerCase().split(/\W+/);
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
