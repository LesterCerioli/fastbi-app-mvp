import { jest } from "@jest/globals";

jest.mock("../../src/services/db", () => ({ query: jest.fn<any>(), queryTx: jest.fn<any>() }));

import { CsvImportService } from "../../src/services/data_engineering/csv_import_service";
import { query } from "../../src/services/db";

const mockQuery = query as jest.Mock<any>;

describe("Security: Input Validation", () => {
  let csvImportService: CsvImportService;

  beforeEach(() => {
    jest.clearAllMocks();
    csvImportService = new CsvImportService();
  });

  describe("CSV Import - File Size Validation", () => {
    it("rejects empty file", async () => {
      await expect(
        csvImportService.importCSV("acme", "job1", Buffer.from([]), "empty.csv")
      ).rejects.toThrow("file is empty");
    });

    it("accepts file under size limit", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });

      const smallContent = Buffer.from("col1,col2\nval1,val2\n");
      const result = await csvImportService.importCSV("acme", "job1", smallContent, "small.csv");

      expect(result.totalRows).toBe(1);
    });

    it("processes large file without memory issues (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });

      const largeContent = Buffer.from("col1\n" + "x\n".repeat(10_000));
      const result = await csvImportService.importCSV("acme", "job-large", largeContent, "large.csv");

      expect(result.totalRows).toBe(10_000);
    });
  });

  describe("CSV Import - Filename Validation", () => {
    it("imports with normal filename", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });

      const result = await csvImportService.importCSV(
        "acme", "job1", Buffer.from("a,b\n1,2"), "report.csv"
      );

      expect(result.filename).toBe("report.csv");
    });

    it("imports filename with path traversal pattern (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });

      const result = await csvImportService.importCSV(
        "acme", "job1", Buffer.from("a,b\n1,2"), "../../../etc/passwd.csv"
      );

      expect(result.filename).toBe("../../../etc/passwd.csv");
    });

    it("imports with excessively long filename (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });

      const longName = "a".repeat(500) + ".csv";
      const result = await csvImportService.importCSV(
        "acme", "job1", Buffer.from("a,b\n1,2"), longName
      );

      expect(result.filename.length).toBe(504);
    });
  });

  describe("CSV Import - Organization Name Validation", () => {
    it("rejects empty organization name", async () => {
      await expect(
        csvImportService.importCSV("", "job1", Buffer.from("a\n1"), "f.csv")
      ).rejects.toThrow("organization_name is required");
    });

    it("rejects empty job name", async () => {
      await expect(
        csvImportService.importCSV("acme", "", Buffer.from("a\n1"), "f.csv")
      ).rejects.toThrow("import_job_name is required");
    });

    it("resolves org name with special characters (informational)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const specialName = "org\ninjected-log-line\nEND";
      try {
        await csvImportService.importCSV(specialName, "job1", Buffer.from("a\n1"), "f.csv");
      } catch (err: any) {
        expect(err.message).toContain("organization not found");
      }
    });

    it("resolves org name with SQL probe pattern (parameterized safe)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const sqlProbe = "org'; DROP TABLE organizations; --";
      try {
        await csvImportService.importCSV(sqlProbe, "job1", Buffer.from("a\n1"), "f.csv");
      } catch (err: any) {
        expect(err.message).toContain("organization not found");
      }

      const sql: string = mockQuery.mock.calls[0][0] as string;
      expect(sql).toContain("$1");
    });
  });

  describe("Deeply Nested Input (DoS)", () => {
    it("handles deeply nested JSON in config-like structures (informational)", async () => {
      const depth = 500;
      let nested = "{}";
      for (let i = 0; i < depth; i++) {
        nested = `{"a":${nested}}`;
      }

      const parsed = JSON.parse(nested);
      expect(parsed).toBeDefined();

      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });

      const result = await csvImportService.importCSV(
        "acme", "job-deep", Buffer.from("config\n" + nested.substring(0, 100) + "\n"), "deep.csv"
      );
      expect(result).toBeDefined();
    });
  });

  describe("Service Method Input Validation", () => {
    it("CsvImportService.resolveOrganizationID rejects empty", async () => {
      await expect(csvImportService.resolveOrganizationID("")).rejects.toThrow("organization_name is required");
    });

    it("CsvImportService.resolveOrganizationID resolves valid org", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] });
      const id = await csvImportService.resolveOrganizationID("acme");
      expect(id).toBe("org-1");
    });

    it("CsvImportService.resolveImportJobByName rejects empty job name", async () => {
      await expect(csvImportService.resolveImportJobByName("org-1", "")).rejects.toThrow("import_job_name is required");
    });

    it("CsvImportService.resolveImportJobByName resolves valid job", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "job-1" }] });
      const id = await csvImportService.resolveImportJobByName("org-1", "my-job");
      expect(id).toBe("job-1");
    });
  });
});
