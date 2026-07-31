import { query } from "../db";

export interface CSVImportResult {
  importJobName: string;
  filename: string;
  totalRows: number;
  headers: string[];
  rows: Record<string, string>[];
  rawJSON: string;
}

export interface CSVImportJob {
  name: string;
  filename: string;
  status: string;
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
}

const MAX_CONCURRENT_IMPORTS = 20;

export class CsvImportService {
  async resolveOrganizationID(orgName: string): Promise<string> {
    if (!orgName) throw new Error("organization_name is required");
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [orgName]
    );
    if (!result.rows[0]) throw new Error(`organization not found: ${orgName}`);
    return result.rows[0].id;
  }

  async resolveImportJobByName(orgID: string, jobName: string): Promise<string> {
    if (!jobName) throw new Error("import_job_name is required");
    const result = await query(
      `SELECT id FROM public.import_jobs WHERE organization_id = $1 AND name = $2`,
      [orgID, jobName]
    );
    if (!result.rows[0]) throw new Error(`import job not found: ${jobName}`);
    return result.rows[0].id;
  }

  async importCSV(
    orgName: string,
    jobName: string,
    fileBytes: Buffer,
    filename: string
  ): Promise<CSVImportResult> {
    if (!orgName) throw new Error("organization_name is required");
    if (!jobName) throw new Error("import_job_name is required");
    if (fileBytes.length === 0) throw new Error("file is empty");

    const orgID = await this.resolveOrganizationID(orgName);
    const { headers, rows } = this.parseCSV(fileBytes);
    const rawJSON = JSON.stringify(rows);
    const now = new Date();

    const result = await query(
      `INSERT INTO public.import_jobs (organization_id, name, filename, file_data, status, created_at, processed_at)
       VALUES ($1, $2, $3, $4, 'completed', $5, $5)
       ON CONFLICT (organization_id, name)
       DO UPDATE SET filename = EXCLUDED.filename, file_data = EXCLUDED.file_data,
                     status = 'completed', processed_at = EXCLUDED.processed_at
       RETURNING id`,
      [orgID, jobName, filename, fileBytes, now]
    );

    console.log(`[INFO] CSV import job persisted: id=${result.rows[0]?.id} name=${jobName} org=${orgName} rows=${rows.length}`);

    return {
      importJobName: jobName,
      filename,
      totalRows: rows.length,
      headers,
      rows,
      rawJSON,
    };
  }

  async getImportJobByName(orgName: string, jobName: string): Promise<CSVImportJob | null> {
    const orgID = await this.resolveOrganizationID(orgName);
    const result = await query(
      `SELECT name, filename, status, error_message, created_at, processed_at
       FROM public.import_jobs WHERE organization_id = $1 AND name = $2`,
      [orgID, jobName]
    );
    if (!result.rows[0]) throw new Error(`import job not found: ${jobName}`);

    const row = result.rows[0];
    return {
      name: row.name,
      filename: row.filename,
      status: row.status,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      processedAt: row.processed_at || undefined,
    };
  }

  async listImportJobs(orgName: string): Promise<CSVImportJob[]> {
    const orgID = await this.resolveOrganizationID(orgName);
    const result = await query(
      `SELECT name, filename, status, error_message, created_at, processed_at
       FROM public.import_jobs WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [orgID]
    );
    return result.rows.map((r: any) => ({
      name: r.name,
      filename: r.filename,
      status: r.status,
      errorMessage: r.error_message || undefined,
      createdAt: r.created_at,
      processedAt: r.processed_at || undefined,
    }));
  }

  private parseCSV(fileBytes: Buffer): { headers: string[]; rows: Record<string, string>[] } {
    const content = fileBytes.toString("utf-8");
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) throw new Error("CSV has no data rows");

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = j < values.length ? values[j] : "";
      }
      rows.push(row);
    }

    if (rows.length === 0) throw new Error("CSV has no data rows");
    return { headers, rows };
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          values.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    values.push(current.trim());
    return values;
  }
}
