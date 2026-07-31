import { query, queryTx } from "../db";

export interface FieldMapping {
  sourceField: string;
  columnHeader: string;
  formatType: string;
}

export interface CSVExportProfile {
  fields: FieldMapping[];
  delimiter: string;
  encoding: string;
  dateFormat: string;
  numberFormat: string;
  nullValue: string;
}

export interface CSVArtifact {
  url: string;
  sizeBytes: number;
  rowCount: number;
  renderedAt: Date;
  filename: string;
}

export function sanitizeCSVCell(val: string): string {
  if (val.length === 0) return val;
  const first = val[0];
  if (["=", "+", "-", "@", "\t", "\r"].includes(first)) {
    return "'" + val;
  }
  return val;
}

export class CsvExportService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async export(
    runID: string,
    orgID: string,
    profile: CSVExportProfile,
    data: Record<string, unknown>[]
  ): Promise<CSVArtifact> {
    const fields = this.resolveFields(profile.fields, data);
    const delim = this.resolveDelimiter(profile.delimiter);
    const nullVal = profile.nullValue;

    const rows: string[][] = [];
    if (fields.length > 0) {
      rows.push(fields.map((f) => f.columnHeader));
    }
    for (const row of data) {
      const record = fields.map((f) =>
        this.formatValue(row[f.sourceField], f.formatType, profile.dateFormat, profile.numberFormat, nullVal)
      );
      rows.push(record);
    }

    const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(delim)).join("\n");
    const fileBytes = Buffer.from(this.applyEncoding(csvContent, profile.encoding));
    const fileName = `report_${runID.substring(0, 8)}.csv`;
    const renderedAt = new Date();

    const result = await query(
      `INSERT INTO public.report_csv_artifacts (run_id, organization_id, file_bytes, file_size_bytes, file_name, row_count, rendered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (run_id) DO UPDATE SET file_bytes = $3, file_size_bytes = $4, file_name = $5, row_count = $6, rendered_at = $7
       RETURNING id`,
      [runID, orgID, fileBytes, fileBytes.length, fileName, rows.length - 1, renderedAt]
    );

    const downloadURL = `${this.baseURL}/api/v1/reports/runs/${runID}/artifacts/csv/download`;

    return {
      url: downloadURL,
      sizeBytes: fileBytes.length,
      rowCount: rows.length - 1,
      renderedAt,
      filename: fileName,
    };
  }

  async upsertProfile(orgID: string, templateID: string, profile: CSVExportProfile): Promise<void> {
    const configBytes = JSON.stringify(profile);
    await query(
      `INSERT INTO public.report_csv_profiles (organization_id, template_id, profile_config)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, template_id) DO UPDATE SET profile_config = $3, updated_at = NOW()`,
      [orgID, templateID, configBytes]
    );
  }

  async getProfile(orgID: string, templateID: string): Promise<CSVExportProfile | null> {
    const result = await query(
      `SELECT profile_config FROM public.report_csv_profiles
       WHERE organization_id = $1 AND template_id = $2`,
      [orgID, templateID]
    );
    if (!result.rows[0]) throw new Error("CSV export profile not found");
    return JSON.parse(result.rows[0].profile_config);
  }

  async getArtifactBytes(runID: string): Promise<{ fileBytes: Buffer; fileName: string; renderedAt: Date }> {
    const result = await query(
      `SELECT file_bytes, file_name, rendered_at FROM public.report_csv_artifacts WHERE run_id = $1`,
      [runID]
    );
    if (!result.rows[0]) throw new Error("CSV artifact not found for this run");
    return {
      fileBytes: result.rows[0].file_bytes,
      fileName: result.rows[0].file_name,
      renderedAt: result.rows[0].rendered_at,
    };
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) throw new Error("organization_name is required");
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
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

  async resolveTemplateIDByName(orgID: string, templateName: string): Promise<string> {
    if (!templateName) throw new Error("template name is required");
    const result = await query(
      `SELECT id FROM public.report_templates WHERE organization_id = $1 AND name = $2 AND is_active = true`,
      [orgID, templateName]
    );
    if (!result.rows[0]) throw new Error(`report template not found: ${templateName}`);
    return result.rows[0].id;
  }

  private resolveFields(profileFields: FieldMapping[], data: Record<string, unknown>[]): FieldMapping[] {
    if (profileFields.length > 0) return profileFields;
    if (data.length === 0) return [];
    const keys = Object.keys(data[0]).sort();
    return keys.map((k) => ({ sourceField: k, columnHeader: k, formatType: "string" }));
  }

  private resolveDelimiter(d: string): string {
    if (d === ";") return ";";
    if (d === "\t") return "\t";
    return ",";
  }

  private formatValue(val: unknown, _formatType: string, dateFormat: string, _numberFormat: string, nullVal: string): string {
    if (val === null || val === undefined) return nullVal;
    if (typeof val === "number") {
      return val.toString();
    }
    if (typeof val === "boolean") {
      return val ? "true" : "false";
    }
    if (val instanceof Date) {
      const fmt = dateFormat || "ISOString";
      if (fmt === "ISOString") return val.toISOString();
      return val.toISOString();
    }
    return sanitizeCSVCell(String(val));
  }

  private applyEncoding(raw: string, _enc: string): string {
    const BOM = "\uFEFF";
    return BOM + raw;
  }
}
