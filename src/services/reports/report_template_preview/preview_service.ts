import { query } from "../../db";
import { SyntheticDataGenerator } from "./synthetic_data_generator";

export type PreviewFormat = "pdf" | "excel" | "html";
export type DataSource = "synthetic" | "live";

const maxConcurrentBenchmarkRuns = 10;
const performanceWarnThresholdMs = 60_000;
const previewArtifactTTL = 24 * 60 * 60 * 1000;

export interface PreviewRequest {
  organizationName: string;
  dataSource: DataSource;
  format: PreviewFormat;
  brandConfigOverride?: Record<string, any>;
}

export interface PreviewArtifact {
  id: string;
  templateID: string;
  templateName: string;
  version: number;
  format: PreviewFormat;
  dataSource: DataSource;
  artifactURL: string;
  renderTimeMs: number;
  sectionCount: number;
  estimatedPages: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface BenchmarkResult {
  templateID: string;
  templateName: string;
  simulatedRuns: number;
  p50Ms: number;
  p95Ms: number;
  performanceWarning: boolean;
  ranAt: Date;
}

interface SectionRow {
  id: string;
  sectionType: string;
  orderIndex: number;
  config: Record<string, any>;
  isOptional: boolean;
  visibilityRule: Record<string, any>;
}

export class TemplatePreviewService {
  constructor(private baseURL: string = "http://localhost:3050") {}

  async resolveOrganizationID(name: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [name]
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${name}`);
    }
    return result.rows[0].id;
  }

  async resolveTemplateID(orgID: string, templateName: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.report_templates WHERE name = $1 AND organization_id = $2 AND is_active = TRUE`,
      [templateName, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error(`report template not found: ${templateName}`);
    }
    return result.rows[0].id;
  }

  async resolveTemplateVersion(templateID: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(current_version, 1) AS version FROM public.report_template_catalog WHERE template_id = $1`,
      [templateID]
    );
    if (result.rows.length === 0) return 1;
    return parseInt(result.rows[0].version, 10);
  }

  async triggerPreview(
    orgName: string,
    templateName: string,
    req: PreviewRequest
  ): Promise<PreviewArtifact> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template_name is required");

    const format = req.format || "html";
    if (!["pdf", "excel", "html"].includes(format)) {
      throw new Error(`unsupported format: ${format} (must be pdf, excel, or html)`);
    }

    const dataSource = req.dataSource || "synthetic";
    if (!["synthetic", "live"].includes(dataSource)) {
      throw new Error(`unsupported data_source: ${dataSource} (must be synthetic or live)`);
    }

    const orgID = await this.resolveOrganizationID(orgName);
    const templateID = await this.resolveTemplateID(orgID, templateName);
    const version = await this.resolveTemplateVersion(templateID);

    const start = Date.now();
    const sections = await this.fetchSectionsWithWidgets(templateID);

    let renderData: Record<string, any>;
    if (dataSource === "synthetic") {
      renderData = this.generateSyntheticData(orgName, templateName, sections);
    } else {
      renderData = await this.fetchLiveData(orgID, sections);
    }

    const estimatedPages = estimatePages(sections.length);
    const renderTimeMs = Date.now() - start;
    const createdAt = new Date();

    const insertResult = await query(
      `INSERT INTO public.report_template_previews
         (organization_id, template_id, version, format, data_source,
          artifact_url, render_time_ms, section_count, estimated_pages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        orgID, templateID, version, format, dataSource,
        "", renderTimeMs, sections.length, estimatedPages,
      ]
    );

    const previewID = insertResult.rows[0].id;
    const artifactURL = `${this.baseURL}/api/v1/reports/templates/${templateName}/previews/${previewID}/download`;

    await query(
      `UPDATE public.report_template_previews SET artifact_url = $1 WHERE id = $2`,
      [artifactURL, previewID]
    );

    return {
      id: previewID,
      templateID,
      templateName,
      version,
      format: format as PreviewFormat,
      dataSource: dataSource as DataSource,
      artifactURL,
      renderTimeMs,
      sectionCount: sections.length,
      estimatedPages,
      expiresAt: new Date(createdAt.getTime() + previewArtifactTTL),
      createdAt,
    };
  }

  async runBenchmark(
    orgName: string,
    templateName: string
  ): Promise<BenchmarkResult> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template_name is required");

    const orgID = await this.resolveOrganizationID(orgName);
    const templateID = await this.resolveTemplateID(orgID, templateName);
    const sections = await this.fetchSectionsWithWidgets(templateID);

    const times: number[] = [];

    const run = async () => {
      const start = Date.now();
      this.generateSyntheticData(orgName, templateName, sections);
      times.push(Date.now() - start);
    };

    const promises: Promise<void>[] = [];
    for (let i = 0; i < maxConcurrentBenchmarkRuns; i++) {
      promises.push(run());
    }
    await Promise.all(promises);

    const [p50, p95] = computePercentiles(times);

    return {
      templateID,
      templateName,
      simulatedRuns: maxConcurrentBenchmarkRuns,
      p50Ms: p50,
      p95Ms: p95,
      performanceWarning: p95 > performanceWarnThresholdMs,
      ranAt: new Date(),
    };
  }

  async listPreviews(
    orgName: string,
    templateName: string
  ): Promise<PreviewArtifact[]> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template_name is required");

    const orgID = await this.resolveOrganizationID(orgName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    const result = await query(
      `SELECT id, template_id, version, format, data_source,
              COALESCE(artifact_url, '') AS artifact_url, render_time_ms, section_count,
              estimated_pages, created_at
       FROM public.report_template_previews
       WHERE template_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
      [templateID, orgID]
    );

    return result.rows.map((r: any) => {
      const createdAt = r.created_at;
      return {
        id: r.id,
        templateID: r.template_id,
        templateName,
        version: r.version,
        format: r.format as PreviewFormat,
        dataSource: r.data_source as DataSource,
        artifactURL: r.artifact_url,
        renderTimeMs: parseInt(r.render_time_ms, 10),
        sectionCount: parseInt(r.section_count, 10),
        estimatedPages: parseInt(r.estimated_pages, 10),
        expiresAt: new Date(createdAt.getTime() + previewArtifactTTL),
        createdAt,
      };
    });
  }

  async getPreview(
    orgName: string,
    templateName: string,
    previewIDStr: string
  ): Promise<PreviewArtifact> {
    if (!orgName) throw new Error("organization_name is required");

    const previewID = previewIDStr;
    const orgID = await this.resolveOrganizationID(orgName);

    const result = await query(
      `SELECT id, template_id, version, format, data_source,
              COALESCE(artifact_url, '') AS artifact_url, render_time_ms, section_count,
              estimated_pages, created_at
       FROM public.report_template_previews
       WHERE id = $1 AND organization_id = $2`,
      [previewID, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error("preview not found");
    }

    const r = result.rows[0];
    const createdAt = r.created_at;
    return {
      id: r.id,
      templateID: r.template_id,
      templateName,
      version: r.version,
      format: r.format as PreviewFormat,
      dataSource: r.data_source as DataSource,
      artifactURL: r.artifact_url,
      renderTimeMs: parseInt(r.render_time_ms, 10),
      sectionCount: parseInt(r.section_count, 10),
      estimatedPages: parseInt(r.estimated_pages, 10),
      expiresAt: new Date(createdAt.getTime() + previewArtifactTTL),
      createdAt,
    };
  }

  private async fetchSectionsWithWidgets(templateID: string): Promise<SectionRow[]> {
    const sectionsResult = await query(
      `SELECT id, type, order_index, config, is_optional,
              COALESCE(visibility_rule, '{}') AS visibility_rule
       FROM public.report_template_sections
       WHERE template_id = $1
       ORDER BY order_index ASC`,
      [templateID]
    );

    const sections: SectionRow[] = [];

    for (const row of sectionsResult.rows) {
      const sec: SectionRow = {
        id: row.id,
        sectionType: row.type,
        orderIndex: row.order_index,
        config: typeof row.config === "string" ? JSON.parse(row.config) : row.config || {},
        isOptional: row.is_optional,
        visibilityRule: typeof row.visibility_rule === "string" ? JSON.parse(row.visibility_rule) : row.visibility_rule || {},
      };
      sections.push(sec);
    }

    return sections;
  }

  private generateSyntheticData(
    orgName: string,
    templateName: string,
    sections: SectionRow[]
  ): Record<string, any> {
    const gen = new SyntheticDataGenerator(orgName, templateName);
    const result: Record<string, any> = {};

    for (const sec of sections) {
      const sData: Record<string, any> = {};

      switch (sec.sectionType) {
        case "kpi_summary": {
          const kpiIDs = sec.config["kpi_ids"] as any[] || ["KPI_001", "KPI_002", "KPI_003"];
          sData["kpis"] = gen.generateKPISummaryData(kpiIDs);
          break;
        }
        case "chart":
          sData["series"] = gen.generateTimeSeries(30, "currency");
          sData["chart_type"] = sec.config["chart_type"];
          break;
        case "table": {
          const columns = (sec.config["columns"] as any[]) || ["name", "revenue", "quantity", "date"];
          sData["rows"] = gen.generateTableRows(columns, 10);
          sData["columns"] = columns;
          break;
        }
        case "executive_summary": {
          const topN = typeof sec.config["top_n"] === "number" ? sec.config["top_n"] : 5;
          const insights: Record<string, any>[] = [];
          for (let i = 0; i < topN; i++) {
            insights.push({
              rank: i + 1,
              insight: gen.generateForBinding("text"),
              impact: gen.generateForBinding("currency"),
            });
          }
          sData["insights"] = insights;
          break;
        }
        case "narrative":
          sData["text"] = `[Synthetic Preview] This section would contain AI-generated narrative for ${sec.config["prompt_fragment"]}. Key metric: ${gen.generateForBinding("currency")}. Period: last 30 days.`;
          break;
        case "custom_html":
          sData["html"] = sec.config["html"];
          break;
      }

      result[`section_${sec.orderIndex}`] = sData;
    }

    return result;
  }

  private async fetchLiveData(
    orgID: string,
    sections: SectionRow[]
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const since = new Date(Date.now() - 30 * 24 * 60 * 60000);

    for (const sec of sections) {
      const sData: Record<string, any> = {};

      if (sec.sectionType === "kpi_summary") {
        const kpiIDs = sec.config["kpi_ids"] as any[];
        try {
          sData["kpis"] = await this.queryKPIValues(orgID, kpiIDs || [], since);
        } catch {
          const gen = new SyntheticDataGenerator("live-fallback", sec.sectionType);
          sData["kpis"] = gen.generateKPISummaryData(kpiIDs || []);
        }
      }

      result[`section_${sec.orderIndex}`] = sData;
    }

    return result;
  }

  private async queryKPIValues(
    orgID: string,
    kpiCodes: any[],
    since: Date
  ): Promise<Record<string, any>[]> {
    if (kpiCodes.length === 0) return [];

    const result = await query(
      `SELECT k.code, COALESCE(kv.value, 0) AS value, COALESCE(k.target_value, 0) AS target_value
       FROM public.kpis k
       LEFT JOIN public.kpi_values kv
         ON kv.kpi_id = k.id AND kv.recorded_at >= $1
       WHERE k.organization_id = $2
       LIMIT 50`,
      [since, orgID]
    );

    return result.rows.map((r: any) => {
      const value = parseFloat(r.value);
      const target = parseFloat(r.target_value);
      const pct = target > 0 ? (value / target) * 100 : 0;
      return {
        code: r.code,
        value,
        target,
        pct_of_target: pct,
      };
    });
  }
}

function estimatePages(sectionCount: number): number {
  if (sectionCount === 0) return 1;
  return Math.ceil(sectionCount / 2);
}

function computePercentiles(times: number[]): [number, number] {
  if (times.length === 0) return [0, 0];
  const sorted = [...times].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return [p50, p95];
}
