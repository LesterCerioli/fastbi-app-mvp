import { query } from "../db";

export interface BrandConfig {
  primaryColor: string;
  accentColor: string;
  reportTitle: string;
  tenantName: string;
  reportPeriod: string;
  generatedDate: string;
  logoURL?: string;
}

export interface ReportKPIData {
  kpiID: string;
  kpiName: string;
  value: number;
  unit: string;
  targetValue?: number;
  variance?: number;
  variancePerc?: number;
  status: string;
}

export interface KPIGroup {
  groupName: string;
  kpis: ReportKPIData[];
}

export interface ReportChart {
  title: string;
  chartType: string;
  seriesNames: string[];
  axisLabels: string[];
}

export interface ReportData {
  kpiGroups: KPIGroup[];
  charts: ReportChart[];
}

export interface NarrativeSection {
  sectionID: number;
  sectionTitle: string;
  text: string;
  isFlagged: boolean;
  flagReason: string;
  citations: Citation[];
}

export interface Citation {
  sourceRef: string;
  text: string;
}

export interface PDFArtifact {
  url: string;
  sizeBytes: number;
  pages: number;
  renderedAt: Date;
  expiresAt: Date;
  filename: string;
}

export class PDFRenderService {
  async render(
    runID: string,
    orgID: string,
    brand: BrandConfig,
    reportData: ReportData,
    sections: NarrativeSection[],
  ): Promise<PDFArtifact> {
    const jobResult = await query(
      `SELECT COALESCE(job_id, '00000000-0000-0000-0000-000000000000') AS job_id FROM public.report_runs WHERE id = $1`,
      [runID]
    );
    if (!jobResult.rows[0]) throw new Error("report run not found");
    const jobID = jobResult.rows[0].job_id;

    const fileBytes = Buffer.from("PDF placeholder"); 
    const sizeBytes = fileBytes.length;
    const fileName = `report_${runID.substring(0, 8)}.pdf`;
    const renderedAt = new Date();
    const totalPages = 0;

    const insertResult = await query(`
      INSERT INTO public.report_artifacts
        (job_id, organization_id, file_bytes, file_size_bytes, file_name, rendered_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (job_id) DO UPDATE
        SET file_bytes = EXCLUDED.file_bytes,
            file_size_bytes = EXCLUDED.file_size_bytes,
            file_name = EXCLUDED.file_name,
            rendered_at = EXCLUDED.rendered_at
      RETURNING id
    `, [jobID, orgID, fileBytes, sizeBytes, fileName, renderedAt]);

    if (!insertResult.rows[0]) throw new Error("failed to store PDF artifact");

    const baseURL = process.env.BASE_URL || "";
    const downloadURL = `${baseURL}/api/v1/reports/runs/${runID}/artifacts/pdf/download`;

    return {
      url: downloadURL,
      sizeBytes,
      pages: totalPages,
      renderedAt,
      expiresAt: new Date(renderedAt.getTime() + 24 * 60 * 60 * 1000),
      filename: fileName,
    };
  }

  async getArtifactBytes(runID: string): Promise<{ fileBytes: Buffer; fileName: string; renderedAt: Date }> {
    const jobResult = await query(
      `SELECT COALESCE(job_id, '00000000-0000-0000-0000-000000000000') AS job_id FROM public.report_runs WHERE id = $1`,
      [runID]
    );
    if (!jobResult.rows[0]) throw new Error("report run not found");
    const jobID = jobResult.rows[0].job_id;

    const result = await query(
      `SELECT file_bytes, file_name, rendered_at FROM public.report_artifacts WHERE job_id = $1`,
      [jobID]
    );
    if (!result.rows[0]) throw new Error("artifact not found for this run");

    const { file_bytes, file_name, rendered_at } = result.rows[0];

    if (new Date() > new Date(rendered_at.getTime() + 24 * 60 * 60 * 1000)) {
      throw new Error("artifact URL expired — please re-render the report");
    }

    return { fileBytes: file_bytes, fileName: file_name, renderedAt: rendered_at };
  }

  async getArtifactInfo(runID: string): Promise<PDFArtifact> {
    const jobResult = await query(
      `SELECT COALESCE(job_id, '00000000-0000-0000-0000-000000000000') AS job_id FROM public.report_runs WHERE id = $1`,
      [runID]
    );
    if (!jobResult.rows[0]) throw new Error("report run not found");
    const jobID = jobResult.rows[0].job_id;

    const result = await query(
      `SELECT file_size_bytes, file_name, rendered_at FROM public.report_artifacts WHERE job_id = $1`,
      [jobID]
    );
    if (!result.rows[0]) throw new Error("artifact not found for this run");

    const { file_size_bytes, file_name, rendered_at } = result.rows[0];
    const baseURL = process.env.BASE_URL || "";

    return {
      url: `${baseURL}/api/v1/reports/runs/${runID}/artifacts/pdf/download`,
      sizeBytes: Number(file_size_bytes),
      pages: 0,
      renderedAt: rendered_at,
      expiresAt: new Date(rendered_at.getTime() + 24 * 60 * 60 * 1000),
      filename: file_name,
    };
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) throw new Error("organization_name is required");
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [organizationName]);
    if (!result.rows[0]) throw new Error(`organization not found: ${organizationName}`);
    return result.rows[0].id;
  }

  async resolveRunIDByCreatedAt(createdAt: Date, organizationName: string): Promise<string> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(`
      SELECT id FROM public.report_runs
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at < ($2::timestamptz + INTERVAL '1 second')
      ORDER BY created_at ASC
    `, [orgID, createdAt]);

    if (result.rows.length === 0) throw new Error("report run not found for the given created_at");
    if (result.rows.length > 1) {
      throw new Error("ambiguous: multiple runs created within the same second; use a more precise timestamp");
    }
    return result.rows[0].id;
  }
}
