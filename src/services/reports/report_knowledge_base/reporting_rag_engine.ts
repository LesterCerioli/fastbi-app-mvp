import { query, queryTx } from "../../db";

export const sourceTypeKPI = "kpi";
export const sourceTypeInsight = "insight";

export interface ContextDocument {
  source: string;
  sourceRef: string;
  content: string;
  score: number;
}

export interface IndexedSourceDTO {
  sourceType: string;
  sourceRef: string;
  version: number;
  lastIndexedAt: Date;
}

export class ReportingRAGEngine {
  constructor() {}

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization_name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  async retrieveReportContext(
    organizationName: string,
    reportType: string,
    topK: number
  ): Promise<ContextDocument[]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    if (topK <= 0) topK = 10;

    const result = await query(
      `SELECT source_type, source_ref, content
       FROM public.report_knowledge_base
       WHERE organization_id = $1
       ORDER BY last_indexed_at DESC
       LIMIT 500`,
      [orgID]
    );

    const docs = result.rows.map((r: any) => ({
      sourceType: r.source_type,
      sourceRef: r.source_ref,
      content: r.content,
    }));

    if (docs.length === 0) return [];

    const queryText = reportType || "report analytics insights kpi";
    const scored = docs.map((d: any) => ({
      doc: d,
      score: this.computeSimilarity(queryText, d.content),
    }));

    scored.sort((a: any, b: any) => b.score - a.score);
    const top = scored.slice(0, Math.min(topK, scored.length));

    return top.map((r: any) => ({
      source: r.doc.sourceType,
      sourceRef: r.doc.sourceRef,
      content: r.doc.content,
      score: r.score,
    }));
  }

  async forceReindex(organizationName: string): Promise<void> {
    const orgID = await this.resolveOrganizationID(organizationName);
    await this.reindexByOrgID(orgID);
  }

  async reindexByOrgID(orgID: string): Promise<void> {
    await Promise.all([
      this.ingestKPIs(orgID),
      this.ingestInsights(orgID),
    ]);
  }

  async listIndexedSources(organizationName: string): Promise<IndexedSourceDTO[]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT source_type, source_ref, version, last_indexed_at
       FROM public.report_knowledge_base
       WHERE organization_id = $1
       ORDER BY last_indexed_at DESC`,
      [orgID]
    );
    return result.rows.map((r: any) => ({
      sourceType: r.source_type,
      sourceRef: r.source_ref,
      version: r.version,
      lastIndexedAt: r.last_indexed_at,
    }));
  }

  async ingestKPIs(orgID: string): Promise<void> {
    const result = await query(
      `SELECT code, name, description, category::text, last_value, target_value
       FROM public.kpis
       WHERE organization_id = $1 AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT 1000`,
      [orgID]
    );

    for (const row of result.rows) {
      const content = this.buildKPIContent(
        row.code, row.name, row.description, row.category,
        row.last_value, row.target_value
      );
      try {
        await this.upsertDocument(orgID, sourceTypeKPI, row.code, content);
      } catch (err) {
        console.warn(`[ReportingRAG] warn: upsert kpi ${row.code}:`, err);
      }
    }
  }

  async ingestInsights(orgID: string): Promise<void> {
    const result = await query(
      `SELECT id::text, insight_type, title, description, confidence
       FROM public.agent_insights
       WHERE organization_id = $1 AND is_dismissed = FALSE
       ORDER BY created_at DESC
       LIMIT 500`,
      [orgID]
    );

    for (const row of result.rows) {
      const content = `Insight [${row.insight_type}] ${row.title}: ${row.description} (confidence: ${row.confidence.toFixed(2)})`;
      try {
        await this.upsertDocument(orgID, sourceTypeInsight, row.id, content);
      } catch (err) {
        console.warn(`[ReportingRAG] warn: upsert insight ${row.id}:`, err);
      }
    }
  }

  async upsertDocument(
    orgID: string,
    sourceType: string,
    sourceRef: string,
    content: string
  ): Promise<void> {
    await query(
      `INSERT INTO public.report_knowledge_base (organization_id, source_type, source_ref, content)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, source_type, source_ref)
       DO UPDATE SET
         content         = EXCLUDED.content,
         version         = public.report_knowledge_base.version + 1,
         last_indexed_at = NOW()`,
      [orgID, sourceType, sourceRef, content]
    );
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

  private buildKPIContent(
    code: string,
    name: string,
    description: string | null,
    category: string,
    lastValue: number | null,
    targetValue: number | null
  ): string {
    let c = `KPI ${code}: ${name}. Category: ${category}.`;
    if (description) c += " " + description;
    if (lastValue != null) c += ` Last value: ${lastValue.toFixed(4)}.`;
    if (targetValue != null) c += ` Target: ${targetValue.toFixed(4)}.`;
    return c;
  }
}
