import { query } from "../db";

export interface ExportJob {
  id: string;
  filename: string;
  status: string;
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
  recordCount?: number;
}

const VALID_STATUSES = new Set(["pending", "processing", "completed", "failed"]);

export class ExportDataService {
  async createExportJob(filename: string): Promise<ExportJob> {
    if (!filename) throw new Error("filename is required");

    const result = await query(
      `INSERT INTO public.export_jobs (filename, status, created_at)
       VALUES ($1, 'pending', CURRENT_TIMESTAMP)
       RETURNING id, filename, status, created_at`,
      [filename]
    );
    const row = result.rows[0];
    console.log(`[INFO] Export job created: ${row.id} for file ${filename}`);

    return {
      id: row.id,
      filename: row.filename,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async updateExportJobStatusByFilename(
    filename: string,
    status: string,
    errorMessage?: string,
    recordCount?: number
  ): Promise<boolean> {
    if (!filename) throw new Error("filename is required");
    if (!VALID_STATUSES.has(status)) throw new Error(`invalid status: ${status}`);

    const result = await query(
      `UPDATE public.export_jobs
       SET status = $1, error_message = $2, record_count = COALESCE($3, record_count),
           processed_at = CASE WHEN $4 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE processed_at END
       WHERE filename = $5`,
      [status, errorMessage, recordCount, status, filename]
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`[INFO] Export job for filename ${filename} status updated to ${status}`);
    }
    return (result.rowCount ?? 0) > 0;
  }

  async getExportJobByFilename(filename: string): Promise<ExportJob | null> {
    if (!filename) throw new Error("filename is required");

    const result = await query(
      `SELECT id, filename, status, error_message, created_at, processed_at, record_count
       FROM public.export_jobs WHERE filename = $1`,
      [filename]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      filename: row.filename,
      status: row.status,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      processedAt: row.processed_at || undefined,
      recordCount: row.record_count || undefined,
    };
  }

  async getExportJobs(status?: string, limit = 100, offset = 0): Promise<ExportJob[]> {
    if (limit <= 0) limit = 100;
    if (offset < 0) offset = 0;

    const result = await query(
      `SELECT id, filename, status, error_message, created_at, processed_at, record_count
       FROM public.export_jobs
       WHERE ($1::text IS NULL OR status = $1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      filename: r.filename,
      status: r.status,
      errorMessage: r.error_message || undefined,
      createdAt: r.created_at,
      processedAt: r.processed_at || undefined,
      recordCount: r.record_count || undefined,
    }));
  }

  async getPendingExportJobs(limit = 100): Promise<ExportJob[]> {
    if (limit <= 0) limit = 100;
    const result = await query(
      `SELECT id, filename, status, error_message, created_at, processed_at, record_count
       FROM public.export_jobs WHERE status = 'pending'
       ORDER BY created_at ASC LIMIT $1`,
      [limit]
    );
    return result.rows.map((r: any) => ({
      id: r.id,
      filename: r.filename,
      status: r.status,
      errorMessage: r.error_message || undefined,
      createdAt: r.created_at,
      processedAt: r.processed_at || undefined,
      recordCount: r.record_count || undefined,
    }));
  }

  async deleteExportJobByFilename(filename: string): Promise<boolean> {
    if (!filename) throw new Error("filename is required");
    const result = await query(`DELETE FROM public.export_jobs WHERE filename = $1`, [filename]);
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[INFO] Export job for filename ${filename} deleted`);
    }
    return (result.rowCount ?? 0) > 0;
  }

  async getExportStatistics(): Promise<Record<string, number>> {
    const result = await query(
      `SELECT COUNT(*) as total_jobs,
              COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
              COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_jobs,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
              COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
              COALESCE(SUM(record_count), 0) as total_records_exported
       FROM public.export_jobs`
    );
    if (!result.rows[0]) {
      return { total_jobs: 0, pending_jobs: 0, processing_jobs: 0, completed_jobs: 0, failed_jobs: 0, total_records_exported: 0 };
    }
    return result.rows[0];
  }

  async getExportJobsByDateRange(startDate: Date, endDate: Date, limit = 100): Promise<ExportJob[]> {
    if (limit <= 0) limit = 100;
    const result = await query(
      `SELECT id, filename, status, error_message, created_at, processed_at, record_count
       FROM public.export_jobs WHERE created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC LIMIT $3`,
      [startDate, endDate, limit]
    );
    return result.rows.map((r: any) => ({
      id: r.id,
      filename: r.filename,
      status: r.status,
      errorMessage: r.error_message || undefined,
      createdAt: r.created_at,
      processedAt: r.processed_at || undefined,
      recordCount: r.record_count || undefined,
    }));
  }

  async getExportJobStatus(filename: string): Promise<string | null> {
    if (!filename) throw new Error("filename is required");
    const result = await query(`SELECT status FROM public.export_jobs WHERE filename = $1`, [filename]);
    return result.rows[0]?.status || null;
  }
}
