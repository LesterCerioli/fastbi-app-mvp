import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { ExportDataService } from "../src/services/data_engineering/export_data_service";
import { query } from "../src/services/db";

describe("ExportDataService", () => {
  let service: ExportDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExportDataService();
  });

  describe("createExportJob", () => {
    it("creates a job successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: "job-1", filename: "export.csv", status: "pending", created_at: new Date() }],
      });
      const job = await service.createExportJob("export.csv");
      expect(job.id).toBe("job-1");
      expect(job.status).toBe("pending");
    });

    it("throws when filename is empty", async () => {
      await expect(service.createExportJob("")).rejects.toThrow("filename is required");
    });
  });

  describe("updateExportJobStatusByFilename", () => {
    it("updates status successfully", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      const result = await service.updateExportJobStatusByFilename("export.csv", "completed");
      expect(result).toBe(true);
    });

    it("throws on invalid status", async () => {
      await expect(service.updateExportJobStatusByFilename("export.csv", "invalid")).rejects.toThrow("invalid status");
    });

    it("throws when filename is empty", async () => {
      await expect(service.updateExportJobStatusByFilename("", "completed")).rejects.toThrow("filename is required");
    });

    it("returns false when no rows updated", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
      const result = await service.updateExportJobStatusByFilename("missing.csv", "completed");
      expect(result).toBe(false);
    });
  });

  describe("getExportJobByFilename", () => {
    it("returns job when found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: "job-1", filename: "export.csv", status: "completed", error_message: null, created_at: new Date(), processed_at: null, record_count: null }],
      });
      const job = await service.getExportJobByFilename("export.csv");
      expect(job).not.toBeNull();
      expect(job!.status).toBe("completed");
    });

    it("returns null when not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const job = await service.getExportJobByFilename("missing.csv");
      expect(job).toBeNull();
    });

    it("throws when filename is empty", async () => {
      await expect(service.getExportJobByFilename("")).rejects.toThrow("filename is required");
    });
  });

  describe("getExportJobs", () => {
    it("returns jobs with filter", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "job-1", filename: "f.csv", status: "pending", error_message: null, created_at: new Date(), processed_at: null, record_count: null }] });
      const jobs = await service.getExportJobs("pending", 10, 0);
      expect(jobs.length).toBe(1);
    });

    it("handles negative limit", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const jobs = await service.getExportJobs(undefined, -1, 0);
      expect(jobs).toEqual([]);
    });
  });

  describe("getPendingExportJobs", () => {
    it("returns pending jobs", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "job-1", filename: "f.csv", status: "pending", error_message: null, created_at: new Date(), processed_at: null, record_count: null }] });
      const jobs = await service.getPendingExportJobs(10);
      expect(jobs.length).toBe(1);
    });

    it("handles zero limit", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const jobs = await service.getPendingExportJobs(0);
      expect(jobs).toEqual([]);
    });
  });

  describe("deleteExportJobByFilename", () => {
    it("deletes job and returns true", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      const result = await service.deleteExportJobByFilename("export.csv");
      expect(result).toBe(true);
    });

    it("returns false when job not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
      const result = await service.deleteExportJobByFilename("missing.csv");
      expect(result).toBe(false);
    });

    it("throws when filename is empty", async () => {
      await expect(service.deleteExportJobByFilename("")).rejects.toThrow("filename is required");
    });
  });

  describe("getExportStatistics", () => {
    it("returns statistics", async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total_jobs: 10, pending_jobs: 2, processing_jobs: 1, completed_jobs: 5, failed_jobs: 2, total_records_exported: 1000 }],
      });
      const stats = await service.getExportStatistics();
      expect(stats.total_jobs).toBe(10);
    });

    it("returns zeros when no rows", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const stats = await service.getExportStatistics();
      expect(stats.total_jobs).toBe(0);
    });
  });

  describe("getExportJobsByDateRange", () => {
    it("returns jobs in date range", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: "job-1", filename: "f.csv", status: "completed", error_message: null, created_at: new Date(), processed_at: null, record_count: null }] });
      const jobs = await service.getExportJobsByDateRange(new Date("2024-01-01"), new Date("2024-12-31"), 10);
      expect(jobs.length).toBe(1);
    });
  });

  describe("getExportJobStatus", () => {
    it("returns status when found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ status: "completed" }] });
      const status = await service.getExportJobStatus("export.csv");
      expect(status).toBe("completed");
    });

    it("returns null when not found", async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const status = await service.getExportJobStatus("missing.csv");
      expect(status).toBeNull();
    });

    it("throws when filename is empty", async () => {
      await expect(service.getExportJobStatus("")).rejects.toThrow("filename is required");
    });
  });
});
