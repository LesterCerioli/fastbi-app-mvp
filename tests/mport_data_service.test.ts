import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

import { MportDataService, type MportDataRecord } from "../src/services/data_engineering/mport_data_service";
import { query } from "../src/services/db";
import { v4 as uuidv4 } from "uuid";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("MportDataService", () => {
  let service: MportDataService;

  const validRecord: MportDataRecord = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    source: "csv_import",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MportDataService();
  });

  describe("validateRecord", () => {
    it("returns empty errors for valid record", async () => {
      const errors = await service.validateRecord(validRecord);

      expect(errors).toHaveLength(0);
    });

    it("validates record with address field", async () => {
      const errors = await service.validateRecord({ ...validRecord, address: "123 Main St" });

      expect(errors).toHaveLength(0);
    });

    it("returns error when name is missing", async () => {
      const errors = await service.validateRecord({ ...validRecord, name: "" });

      expect(errors).toContain("name is required");
    });

    it("returns error when name is whitespace", async () => {
      const errors = await service.validateRecord({ ...validRecord, name: "   " });

      expect(errors).toContain("name is required");
    });

    it("returns error when email is missing", async () => {
      const errors = await service.validateRecord({ ...validRecord, email: "" });

      expect(errors).toContain("email is required");
    });

    it("returns error for invalid email format", async () => {
      const errors = await service.validateRecord({ ...validRecord, email: "not-an-email" });

      expect(errors).toContain("invalid email format");
    });

    it("returns error when phone is missing", async () => {
      const errors = await service.validateRecord({ ...validRecord, phone: "" });

      expect(errors).toContain("phone is required");
    });

    it("returns error when source is missing", async () => {
      const errors = await service.validateRecord({ ...validRecord, source: "" });

      expect(errors).toContain("source is required");
    });
  });

  describe("importRecords", () => {
    it("imports records and returns import result", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.importRecords([validRecord]);

      expect(result.recordsImported).toBe(1);
      expect(result.duplicatesSkipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    it("skips duplicate records by email", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "existing-id" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.importRecords([validRecord]);

      expect(result.recordsImported).toBe(0);
      expect(result.duplicatesSkipped).toBe(1);
    });

    it("collects validation errors and continues", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const invalidRecord = { ...validRecord, email: "bad-email" };
      const result = await service.importRecords([validRecord, invalidRecord]);

      expect(result.recordsImported).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.errorMessages[0]).toContain("invalid email format");
    });

    it("handles database insert errors gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockRejectedValueOnce(new Error("unique constraint violation"))
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.importRecords([validRecord]);

      expect(result.recordsImported).toBe(0);
      expect(result.errors).toBe(1);
    });

    it("throws when records array is empty", async () => {
      await expect(service.importRecords([])).rejects.toThrow("no records to import");
    });

    it("handles multiple records with mixed outcomes", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "dup" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const r1: MportDataRecord = { name: "A", email: "a@test.com", phone: "111", source: "csv" };
      const r2: MportDataRecord = { name: "B", email: "b@test.com", phone: "222", source: "csv" };

      const result = await service.importRecords([r1, r2]);

      expect(result.recordsImported).toBe(1);
      expect(result.duplicatesSkipped).toBe(1);
    });

    it("logs import summary to console", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await service.importRecords([validRecord]);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO] Import job"));
      consoleSpy.mockRestore();
    });

    it("returns jobID from uuid", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.importRecords([validRecord]);

      expect(result.jobID).toBe("mock-uuid");
    });
  });

  describe("getRecordByEmail", () => {
    it("returns record when found", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "rec-1", name: "John", email: "john@example.com", phone: "+123", address: null, source: "csv", created_at: new Date(), updated_at: new Date() }],
      } as any);

      const result = await service.getRecordByEmail("john@example.com");

      expect(result).not.toBeNull();
      expect(result!.name).toBe("John");
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getRecordByEmail("notfound@test.com");

      expect(result).toBeNull();
    });

    it("trims and lowercases email in query", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.getRecordByEmail("  John@Example.COM  ");

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ["john@example.com"]);
    });

    it("throws when email is empty", async () => {
      await expect(service.getRecordByEmail("")).rejects.toThrow("email is required");
    });

    it("throws on database error", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getRecordByEmail("test@test.com")).rejects.toThrow("db error");
    });

    it("handles null address gracefully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "rec-2", name: "Jane", email: "jane@test.com", phone: "+456", address: null, source: "api", created_at: new Date(), updated_at: new Date() }],
      } as any);

      const result = await service.getRecordByEmail("jane@test.com");

      expect(result!.address).toBeUndefined();
    });
  });

  describe("updateRecord", () => {
    it("updates record and returns merged result", async () => {
      const now = new Date();
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: "rec-1", name: "Old", email: "old@test.com", phone: "111", address: null, source: "csv", created_at: now, updated_at: now }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.updateRecord("rec-1", { name: "New Name" });

      expect(result).not.toBeNull();
      expect(result!.name).toBe("New Name");
    });

    it("returns null when record not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.updateRecord("invalid-id", { name: "New" });

      expect(result).toBeNull();
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.updateRecord("rec-1", { name: "New" })).rejects.toThrow("db error");
    });

    it("handles null address in update", async () => {
      const now = new Date();
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: "rec-1", name: "Test", email: "test@test.com", phone: "111", address: "Old Addr", source: "csv", created_at: now, updated_at: now }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.updateRecord("rec-1", { address: undefined });

      expect(result!.address).toBe("Old Addr");
    });
  });

  describe("deleteRecord", () => {
    it("returns true when delete succeeds (rowCount > 0)", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

      const result = await service.deleteRecord("rec-1");

      expect(result).toBe(true);
    });

    it("returns false when record not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 } as any);

      const result = await service.deleteRecord("rec-1");

      expect(result).toBe(false);
    });

    it("returns false when rowCount is undefined", async () => {
      mockQuery.mockResolvedValueOnce({} as any);

      const result = await service.deleteRecord("rec-1");

      expect(result).toBe(false);
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("delete error"));

      await expect(service.deleteRecord("rec-1")).rejects.toThrow("delete error");
    });
  });

  describe("listRecords", () => {
    it("returns all records when no source filter", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "r1", name: "A", email: "a@t.com", phone: "111", address: null, source: "csv", created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.listRecords();

      expect(result).toHaveLength(1);
    });

    it("filters by source when provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.listRecords("api");

      expect(mockQuery.mock.calls[0][1]).toContain("api");
    });

    it("uses default pagination values", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.listRecords();

      const params = mockQuery.mock.calls[0][1] as any[];
      expect(params[0]).toBe(100);
      expect(params[1]).toBe(0);
    });

    it("applies custom limit and offset", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await service.listRecords(undefined, 50, 10);

      const params = mockQuery.mock.calls[0][1] as any[];
      expect(params[0]).toBe(50);
      expect(params[1]).toBe(10);
    });

    it("returns empty array when no records", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.listRecords();

      expect(result).toHaveLength(0);
    });

    it("handles null address in results", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "r1", name: "A", email: "a@t.com", phone: "111", address: null, source: "csv", created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.listRecords();

      expect(result[0].address).toBeUndefined();
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("list error"));

      await expect(service.listRecords()).rejects.toThrow("list error");
    });
  });

  describe("getImportJobSummary", () => {
    it("returns import job summary when found", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "job-1", records_imported: "10", duplicates_skipped: "2", errors: "1", error_messages: '["err1"]', created_at: new Date() }],
      } as any);

      const result = await service.getImportJobSummary("job-1");

      expect(result).not.toBeNull();
      expect(result!.recordsImported).toBe(10);
      expect(result!.errorMessages).toContain("err1");
    });

    it("returns null when job not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getImportJobSummary("invalid-job");

      expect(result).toBeNull();
    });

    it("parses string error_messages JSON", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "job-2", records_imported: "5", duplicates_skipped: "0", errors: "0", error_messages: "[]", created_at: new Date() }],
      } as any);

      const result = await service.getImportJobSummary("job-2");

      expect(result!.errorMessages).toEqual([]);
    });

    it("handles missing error_messages", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "job-3", records_imported: "5", duplicates_skipped: "0", errors: "0", error_messages: null, created_at: new Date() }],
      } as any);

      const result = await service.getImportJobSummary("job-3");

      expect(result!.errorMessages).toEqual([]);
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getImportJobSummary("job-1")).rejects.toThrow("db error");
    });
  });

  describe("getImportStatistics", () => {
    it("returns statistics from query result", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_records: "100", unique_sources: "5", recent_imports: "20" }],
      } as any);

      const result = await service.getImportStatistics();

      expect(result.total_records).toBe("100");
      expect(result.unique_sources).toBe("5");
    });

    it("returns empty object when no rows", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getImportStatistics();

      expect(result).toEqual({ total_records: 0, unique_sources: 0, recent_imports: 0 });
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getImportStatistics()).rejects.toThrow("db error");
    });
  });
});
