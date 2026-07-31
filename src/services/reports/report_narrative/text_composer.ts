import { DataVerifier, RawClaim } from "./data_verifier";
import { KBDocument, RetrievedContext } from "./context_retriever";

export interface NarrativeSectionRequest {
  sectionID: string;
  title: string;
  sectionType: string;
  queryHint: string;
  topK?: number;
  lookbackDays?: number;
}

export interface ComposedSection {
  text: string;
  claims: RawClaim[];
}

export class TextComposer {
  private verifier = new DataVerifier();

  compose(req: NarrativeSectionRequest, retrieved: RetrievedContext): ComposedSection {
    switch (req.sectionType) {
      case "revenue":
        return this.composeRevenue(req, retrieved);
      case "kpi":
        return this.composeKPI(req, retrieved);
      case "trend":
        return this.composeTrend(req, retrieved);
      case "anomaly":
        return this.composeAnomaly(req, retrieved);
      case "executive":
        return this.composeExecutive(req, retrieved);
      default:
        return this.composeSummary(req, retrieved);
    }
  }

  private composeRevenue(req: NarrativeSectionRequest, rc: RetrievedContext): ComposedSection {
    const total = rc.numericData["sales_records:total_revenue"] || 0;
    const prev = rc.numericData["sales_records:prev_total_revenue"] || 0;
    const count = rc.numericData["sales_records:transaction_count"] || 0;
    const avg = rc.numericData["sales_records:avg_order_value"] || 0;
    const growthPct = rc.numericData["sales_records:growth_pct"] || 0;

    const [growthDir, growthAdj] = this.growthDescriptor(growthPct);

    let text =
      `During the analysis period (${rc.period}), total revenue reached ${total.toFixed(2)} [source:sales_records:total_revenue], ` +
      `representing a ${this.absVal(growthPct).toFixed(2)}% ${growthDir} compared to the previous period (${prev.toFixed(2)}) [source:sales_records:prev_total_revenue]. ` +
      `A total of ${count.toFixed(0)} transactions were recorded [source:sales_records:transaction_count], ` +
      `with an average order value of ${avg.toFixed(2)} [source:sales_records:avg_order_value]. `;

    text += growthAdj;

    const catLines = this.buildTopCategoriesText(rc.numericData);
    if (catLines) text += catLines;

    const kbText = this.buildKBSnippets(rc.kbDocuments, 2);
    if (kbText) text += " " + kbText;

    const claims = this.verifier.extractNumericClaims(text, "sales_records:total_revenue", rc.numericData);
    return { text, claims };
  }

  private composeKPI(req: NarrativeSectionRequest, rc: RetrievedContext): ComposedSection {
    let text = `KPI Analysis — ${req.title}: `;
    let anyKPI = false;

    for (const [ref, val] of Object.entries(rc.numericData)) {
      if (!ref.startsWith("kpis:") || !ref.endsWith(":actual_value")) continue;
      let code = ref.slice("kpis:".length);
      code = code.slice(0, -":actual_value".length);

      const targetRef = `kpis:${code}:target_value`;
      const varRef = `kpis:${code}:variance_pct`;
      const target = rc.numericData[targetRef] || 0;
      const variance = rc.numericData[varRef] || 0;

      let status = "on target";
      if (variance > 5) status = "above target";
      else if (variance < -5) status = "below target";

      text +=
        `KPI ${code} has a current value of ${val.toFixed(4)} [source:${ref}], against a target of ${target.toFixed(4)} [source:${targetRef}], ` +
        `and is ${status} (variance: ${variance.toFixed(2)}%) [source:${varRef}]. `;
      anyKPI = true;
    }

    if (!anyKPI) text += "No KPI data was available for the current period.";

    const kbText = this.buildKBSnippets(rc.kbDocuments, 1);
    if (kbText) text += " " + kbText;

    const claims = this.verifier.extractNumericClaims(text, "kpis:actual_value", rc.numericData);
    return { text, claims };
  }

  private composeTrend(req: NarrativeSectionRequest, rc: RetrievedContext): ComposedSection {
    const total = rc.numericData["sales_records:total_revenue"] || 0;
    const growthPct = rc.numericData["sales_records:growth_pct"] || 0;
    const [growthDir] = this.growthDescriptor(growthPct);

    let direction = "stable";
    if (growthPct > 5) direction = "upward";
    else if (growthPct < -5) direction = "downward";

    let text =
      `Trend analysis for the period (${rc.period}) indicates an ${direction} movement in revenue. ` +
      `Total revenue of ${total.toFixed(2)} [source:sales_records:total_revenue] shows a ${this.absVal(growthPct).toFixed(2)}% ${growthDir} trend [source:sales_records:growth_pct]. `;

    const kbText = this.buildKBSnippets(rc.kbDocuments, 2);
    if (kbText) text += kbText;

    const claims = this.verifier.extractNumericClaims(text, "sales_records:total_revenue", rc.numericData);
    return { text, claims };
  }

  private composeAnomaly(req: NarrativeSectionRequest, rc: RetrievedContext): ComposedSection {
    let text = "Anomaly Detection Report: ";
    let found = false;

    for (const [ref, val] of Object.entries(rc.numericData)) {
      if (!ref.startsWith("agent_anomalies:") || !ref.endsWith(":zscore")) continue;
      let metric = ref.slice("agent_anomalies:".length);
      metric = metric.slice(0, -":zscore".length);

      const expected = rc.numericData[`agent_anomalies:${metric}:expected`] || 0;
      const actual = rc.numericData[`agent_anomalies:${metric}:actual`] || 0;
      const severity = this.classifyZScore(val);

      text +=
        `Metric '${metric}' shows a ${severity} anomaly with a z-score of ${val.toFixed(2)} [source:${ref}]. ` +
        `Expected value was ${expected.toFixed(4)} [source:agent_anomalies:${metric}:expected] ` +
        `but actual observed value was ${actual.toFixed(4)} [source:agent_anomalies:${metric}:actual]. `;
      found = true;
    }

    if (!found) text += "No active anomalies were detected for the current period.";

    const kbText = this.buildKBSnippets(rc.kbDocuments, 1);
    if (kbText) text += " " + kbText;

    const claims = this.verifier.extractNumericClaims(text, "agent_anomalies", rc.numericData);
    return { text, claims };
  }

  private composeExecutive(req: NarrativeSectionRequest, rc: RetrievedContext): ComposedSection {
    const total = rc.numericData["sales_records:total_revenue"] || 0;
    const prev = rc.numericData["sales_records:prev_total_revenue"] || 0;
    const growthPct = rc.numericData["sales_records:growth_pct"] || 0;
    const count = rc.numericData["sales_records:transaction_count"] || 0;
    const avg = rc.numericData["sales_records:avg_order_value"] || 0;

    const [growthDir, growthAdj] = this.growthDescriptor(growthPct);

    let text =
      `Executive Summary (${rc.period}): The organization recorded total revenue of ${total.toFixed(2)} [source:sales_records:total_revenue], ` +
      `a ${this.absVal(growthPct).toFixed(2)}% ${growthDir} from the prior period (${prev.toFixed(2)}) [source:sales_records:prev_total_revenue]. ` +
      `Transaction volume reached ${count.toFixed(0)} [source:sales_records:transaction_count] ` +
      `with an average order value of ${avg.toFixed(2)} [source:sales_records:avg_order_value]. `;

    text += growthAdj;

    const catLines = this.buildTopCategoriesText(rc.numericData);
    if (catLines) text += catLines;

    const kpiLines = this.buildKPIHighlights(rc.numericData);
    if (kpiLines) text += kpiLines;

    const kbText = this.buildKBSnippets(rc.kbDocuments, 3);
    if (kbText) text += " " + kbText;

    const claims = this.verifier.extractNumericClaims(text, "sales_records:total_revenue", rc.numericData);
    return { text, claims };
  }

  private composeSummary(req: NarrativeSectionRequest, rc: RetrievedContext): ComposedSection {
    const total = rc.numericData["sales_records:total_revenue"] || 0;
    const growthPct = rc.numericData["sales_records:growth_pct"] || 0;
    const [growthDir] = this.growthDescriptor(growthPct);

    let text =
      `Analysis summary for section '${req.title}': Revenue stood at ${total.toFixed(2)} [source:sales_records:total_revenue] ` +
      `with a ${this.absVal(growthPct).toFixed(2)}% ${growthDir} over the observed period (${rc.period}). `;

    const kbText = this.buildKBSnippets(rc.kbDocuments, 2);
    if (kbText) text += kbText;

    const claims = this.verifier.extractNumericClaims(text, "sales_records:total_revenue", rc.numericData);
    return { text, claims };
  }

  private buildTopCategoriesText(numericData: Record<string, number>): string {
    const parts: string[] = [];
    for (const [ref, val] of Object.entries(numericData)) {
      if (ref.startsWith("sales_records:category:") && ref.endsWith(":revenue")) {
        let cat = ref.slice("sales_records:category:".length);
        cat = cat.slice(0, -":revenue".length);
        parts.push(`${cat}: ${val.toFixed(2)} [source:${ref}]`);
      }
    }
    if (parts.length === 0) return "";
    return "Top revenue categories: " + parts.join(", ") + ". ";
  }

  private buildKPIHighlights(numericData: Record<string, number>): string {
    const parts: string[] = [];
    for (const [ref, val] of Object.entries(numericData)) {
      if (ref.startsWith("kpis:") && ref.endsWith(":actual_value")) {
        let code = ref.slice("kpis:".length);
        code = code.slice(0, -":actual_value".length);
        parts.push(`${code}=${val.toFixed(4)} [source:${ref}]`);
        if (parts.length >= 3) break;
      }
    }
    if (parts.length === 0) return "";
    return "Key performance indicators: " + parts.join("; ") + ". ";
  }

  private buildKBSnippets(docs: KBDocument[], maxDocs: number): string {
    if (docs.length === 0) return "";
    let text = "Supporting context: ";
    let count = 0;
    for (const d of docs) {
      if (d.score < 0.1) continue;
      let snippet = d.content;
      if (snippet.length > 120) snippet = snippet.slice(0, 120) + "...";
      text += `${snippet} [source:${d.sourceRef}]. `;
      count++;
      if (count >= maxDocs) break;
    }
    return text;
  }

  private growthDescriptor(pct: number): [string, string] {
    if (pct > 20) return ["increase", "Strong positive momentum; maintain current strategies and consider scaling high-performing channels. "];
    if (pct > 5) return ["increase", "Positive growth trajectory; review contributing factors to reinforce successful practices. "];
    if (pct > -5) return ["change", "Performance is relatively stable; monitor for early signals of trend reversals. "];
    if (pct > -20) return ["decline", "A moderate decline warrants investigation into contributing factors and corrective action. "];
    return ["decline", "Significant revenue contraction detected; immediate strategic review is recommended. "];
  }

  private classifyZScore(z: number): string {
    if (z > 3) return "critical";
    if (z > 2) return "high";
    return "moderate";
  }

  private absVal(f: number): number {
    return f < 0 ? -f : f;
  }
}
