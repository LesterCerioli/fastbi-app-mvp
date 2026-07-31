import { query, queryTx } from "../db";

export interface BrandConfig {
  logoURL?: string;
  primaryColor: string;
  accentColor: string;
  tenantName: string;
  reportTitle: string;
  reportPeriod: string;
  generatedDate?: string;
}

export interface KPI {
  kpiName: string;
  kpiID?: string;
  category: string;
  value: number;
  targetValue?: number;
  variance?: number;
  variancePerc?: number;
  unit: string;
  status: string;
  calculatedAt: Date;
  sortOrder?: number;
}

export interface KPIGroup {
  groupName: string;
  sortOrder: number;
  kpis: KPI[];
}

export interface ChartPosition {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

export interface ReportChart {
  chartType: string;
  title: string;
  seriesNames: string[];
  axisLabels: string[];
  dataRange: string;
  position: ChartPosition;
}

export interface ReportData {
  kpiGroups: KPIGroup[];
  charts: ReportChart[];
  rawData: Record<string, unknown>[];
}

export interface ExcelArtifact {
  url: string;
  sizeBytes: number;
  worksheets: string[];
  renderedAt: Date;
  filename: string;
}

export function sanitizeSheetName(name: string): string {
  let s = name.trim();
  if (s.length === 0) return "Sheet";
  s = s.replace(/[:\\/?*]/g, " ").replace(/\[/g, "(").replace(/\]/g, ")");
  if (s.length > 31) s = s.substring(0, 31);
  return s;
}

export function sanitizeRangeName(name: string): string {
  let s = name.trim();
  if (s.length === 0) return "";
  s = s.replace(/[^a-zA-Z0-9_ -]/g, "").replace(/[ -]/g, "_");
  if (s.length > 0 && s[0] >= "0" && s[0] <= "9") s = "_" + s;
  if (s === "") s = "Range";
  if (s.length > 255) s = s.substring(0, 255);
  return s;
}

export function columnLetter(index: number): string {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export function orderedKeys(m: Record<string, unknown>): string[] {
  return Object.keys(m).sort();
}

export function mapChartType(t: string): string {
  const ct = t.toLowerCase();
  const types: Record<string, string> = {
    bar: "bar",
    line: "line",
    pie: "pie",
    column: "column",
    bar3d: "bar3DClustered",
    line3d: "line3D",
    pie3d: "pie3D",
    doughnut: "doughnut",
    radar: "radar",
    scatter: "scatter",
  };
  return types[ct] || "column";
}

export class ExcelExportService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async export(
    runID: string,
    orgID: string,
    brandConfig: BrandConfig,
    reportData: ReportData
  ): Promise<ExcelArtifact> {
    const worksheets: string[] = ["Cover"];
    const definedRangeNames: Record<string, string> = {};

    const rawSheetName = "Raw Data";
    worksheets.push(rawSheetName);

    const fileBytes = Buffer.from(""); // placeholder: actual Excel generation would use a library
    const sizeBytes = fileBytes.length;
    const fileName = `report_${runID.substring(0, 8)}.xlsx`;
    const renderedAt = new Date();

    const jobResult = await query(
      `SELECT COALESCE(job_id, '00000000-0000-0000-0000-000000000000') FROM public.report_runs WHERE id = $1`,
      [runID]
    );
    if (!jobResult.rows[0]) throw new Error("report run not found");
    const jobID = jobResult.rows[0].coalesce;

    await query(
      `INSERT INTO public.report_artifacts (job_id, organization_id, file_bytes, file_size_bytes, file_name, rendered_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (job_id) DO UPDATE SET file_bytes = $3, file_size_bytes = $4, file_name = $5, rendered_at = $6`,
      [jobID, orgID, fileBytes, sizeBytes, fileName, renderedAt]
    );

    const downloadURL = `${this.baseURL}/api/v1/reports/runs/${runID}/artifacts/excel/download`;

    return {
      url: downloadURL,
      sizeBytes,
      worksheets,
      renderedAt,
      filename: fileName,
    };
  }

  async getArtifact(artifactID: string): Promise<ExcelArtifact> {
    const result = await query(
      `SELECT id, job_id, organization_id, file_bytes, file_size_bytes, file_name, rendered_at
       FROM public.report_artifacts WHERE id = $1`,
      [artifactID]
    );
    if (!result.rows[0]) throw new Error("artifact not found");
    const row = result.rows[0];
    const downloadURL = `${this.baseURL}/api/v1/reports/artifacts/${artifactID}/download`;

    return {
      url: downloadURL,
      sizeBytes: row.file_size_bytes,
      filename: row.file_name,
      worksheets: [],
      renderedAt: row.rendered_at,
    };
  }

  async deleteArtifact(artifactID: string): Promise<void> {
    const result = await query(`DELETE FROM public.report_artifacts WHERE id = $1`, [artifactID]);
    if (result.rowCount === 0) throw new Error("artifact not found");
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) throw new Error("organization_name is required");
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [organizationName]);
    if (!result.rows[0]) throw new Error(`organization not found: ${organizationName}`);
    return result.rows[0].id;
  }

  async resolveRunIDByCreatedAt(createdAt: Date, organizationName: string): Promise<string> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id FROM public.report_runs
       WHERE organization_id = $1 AND created_at >= $2 AND created_at < ($2::timestamptz + INTERVAL '1 second')`,
      [orgID, createdAt]
    );
    if (!result.rows[0]) throw new Error("report run not found for the given created_at");
    return result.rows[0].id;
  }

  async getArtifactBytes(runID: string): Promise<{ fileBytes: Buffer; fileName: string; renderedAt: Date }> {
    const jobResult = await query(
      `SELECT COALESCE(job_id, '00000000-0000-0000-0000-000000000000') FROM public.report_runs WHERE id = $1`,
      [runID]
    );
    if (!jobResult.rows[0]) throw new Error("report run not found");
    const jobID = jobResult.rows[0].coalesce;

    const result = await query(
      `SELECT file_bytes, file_name, rendered_at FROM public.report_artifacts WHERE job_id = $1`,
      [jobID]
    );
    if (!result.rows[0]) throw new Error("artifact not found for this run");
    return {
      fileBytes: result.rows[0].file_bytes,
      fileName: result.rows[0].file_name,
      renderedAt: result.rows[0].rendered_at,
    };
  }
}
