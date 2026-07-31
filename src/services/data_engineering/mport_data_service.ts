import { query } from "../db";
import { v4 as uuidv4 } from "uuid";

export interface MportDataRecord {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MportImportResult {
  jobID: string;
  recordsImported: number;
  duplicatesSkipped: number;
  errors: number;
  errorMessages: string[];
}

export class MportDataService {
  async validateRecord(record: MportDataRecord): Promise<string[]> {
    const errors: string[] = [];

    if (!record.name || record.name.trim().length === 0) {
      errors.push("name is required");
    }
    if (!record.email || record.email.trim().length === 0) {
      errors.push("email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push(`invalid email format: ${record.email}`);
    }
    if (!record.phone || record.phone.trim().length === 0) {
      errors.push("phone is required");
    }
    if (!record.source || record.source.trim().length === 0) {
      errors.push("source is required");
    }

    return errors;
  }

  async importRecords(records: MportDataRecord[]): Promise<MportImportResult> {
    if (records.length === 0) throw new Error("no records to import");

    const jobID = uuidv4();
    let recordsImported = 0;
    let duplicatesSkipped = 0;
    const errorMessages: string[] = [];

    for (const record of records) {
      const validationErrors = await this.validateRecord(record);
      if (validationErrors.length > 0) {
        errorMessages.push(`Record '${record.name}': ${validationErrors.join("; ")}`);
        continue;
      }

      const existing = await query(
        `SELECT id FROM public.mport_data WHERE email = $1`,
        [record.email]
      );

      if (existing.rows[0]) {
        duplicatesSkipped++;
        continue;
      }

      try {
        await query(
          `INSERT INTO public.mport_data (id, name, email, phone, address, source, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [uuidv4(), record.name.trim(), record.email.trim().toLowerCase(), record.phone.trim(), record.address?.trim(), record.source.trim()]
        );
        recordsImported++;
      } catch (err: any) {
        errorMessages.push(`Record '${record.name}': ${err.message}`);
      }
    }

    const result: MportImportResult = {
      jobID,
      recordsImported,
      duplicatesSkipped,
      errors: errorMessages.length,
      errorMessages,
    };

    await query(
      `INSERT INTO public.mport_import_jobs (id, records_imported, duplicates_skipped, errors, error_messages, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [jobID, recordsImported, duplicatesSkipped, result.errors, JSON.stringify(errorMessages)]
    );

    console.log(`[INFO] Import job ${jobID}: ${recordsImported} imported, ${duplicatesSkipped} duplicates, ${result.errors} errors`);

    return result;
  }

  async getRecordByEmail(email: string): Promise<MportDataRecord | null> {
    if (!email) throw new Error("email is required");

    const result = await query(
      `SELECT id, name, email, phone, address, source, created_at, updated_at
       FROM public.mport_data WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (!result.rows[0]) return null;

    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address || undefined,
      source: r.source,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async updateRecord(id: string, updates: Partial<MportDataRecord>): Promise<MportDataRecord | null> {
    const existing = await query(
      `SELECT id, name, email, phone, address, source, created_at, updated_at FROM public.mport_data WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) return null;

    const current = existing.rows[0];
    const merged = { ...current, ...updates, updatedAt: new Date() };

    await query(
      `UPDATE public.mport_data SET name = $1, email = $2, phone = $3, address = $4, source = $5, updated_at = $6 WHERE id = $7`,
      [merged.name, merged.email, merged.phone, merged.address, merged.source, merged.updatedAt, id]
    );

    return {
      id: merged.id,
      name: merged.name,
      email: merged.email,
      phone: merged.phone,
      address: merged.address || undefined,
      source: merged.source,
      createdAt: merged.created_at,
      updatedAt: merged.updatedAt,
    };
  }

  async deleteRecord(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM public.mport_data WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async listRecords(source?: string, limit = 100, offset = 0): Promise<MportDataRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (source) {
      conditions.push(`source = $${paramIdx++}`);
      params.push(source);
    }

    const result = await query(
      `SELECT id, name, email, phone, address, source, created_at, updated_at FROM public.mport_data
       ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address || undefined,
      source: r.source,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getImportJobSummary(jobID: string): Promise<MportImportResult | null> {
    const result = await query(
      `SELECT id, records_imported, duplicates_skipped, errors, error_messages, created_at
       FROM public.mport_import_jobs WHERE id = $1`,
      [jobID]
    );
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      jobID: r.id,
      recordsImported: parseInt(r.records_imported),
      duplicatesSkipped: parseInt(r.duplicates_skipped),
      errors: parseInt(r.errors),
      errorMessages: typeof r.error_messages === "string" ? JSON.parse(r.error_messages) : (r.error_messages || []),
    };
  }

  async getImportStatistics(): Promise<Record<string, number>> {
    const result = await query(
      `SELECT COUNT(*) as total_records, COUNT(DISTINCT source) as unique_sources,
              COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_imports
       FROM public.mport_data`
    );
    return result.rows[0] || { total_records: 0, unique_sources: 0, recent_imports: 0 };
  }
}
