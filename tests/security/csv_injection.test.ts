jest.mock("../../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { CsvImportService } from "../../src/services/data_engineering/csv_import_service";
import { query } from "../../src/services/db";

const mockQuery = query as jest.Mock<any>;

describe("Security: CSV Injection", () => {
  let service: CsvImportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CsvImportService();
  });

  describe("Formula Injection (DDE / Spreadsheet)", () => {
    const formulaPayloads = [
      "=CMD| /C calc",
      "+SUM(1,1)",
      "-SUM(1,1)",
      "@SUM(1,1)",
      "=1+1",
      "=HYPERLINK('http://evil.com' 'Click')",
    ];

    formulaPayloads.forEach((payload) => {
      it(`imports CSV with formula payload: "${payload.substring(0, 40)}..."`, async () => {
        const csvContent = `name,value\n,"${payload}"`;
        mockQuery.mockResolvedValue({ rows: [{ id: "org-1" }] });
        mockQuery.mockResolvedValue({ rows: [{ id: "job-1" }] });

        const result = await service.importCSV(
          "test-org", "test-job",
          Buffer.from(csvContent), "test.csv"
        );

        expect(result.totalRows).toBe(1);
        expect(result.rows[0].value).toBe(payload);
      });
    });
  });

  describe("Safe Values", () => {
    const safeValues = [
      "John Doe",
      "123 Main St",
      "São Paulo",
      "11/2024",
      "abc@company.com",
      "(11) 99999-8888",
    ];

    safeValues.forEach((val) => {
      it(`imports CSV with safe value: "${val}"`, async () => {
        const csvContent = `name,value\n,${val}`;
        mockQuery.mockResolvedValue({ rows: [{ id: "org-1" }] });
        mockQuery.mockResolvedValue({ rows: [{ id: "job-1" }] });

        const result = await service.importCSV(
          "test-org", "test-job",
          Buffer.from(csvContent), "test.csv"
        );

        expect(result.rows[0].value).toBe(val);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty CSV content (rejected)", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org-1" }] });

      await expect(
        service.importCSV("test-org", "test-job", Buffer.from(""), "empty.csv")
      ).rejects.toThrow("file is empty");
    });

    it("imports CSV with quoted formula payload", async () => {
      const csvContent = 'name,value\n,"=1+1"';
      mockQuery.mockResolvedValue({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValue({ rows: [{ id: "job-1" }] });

      const result = await service.importCSV(
        "test-org", "test-job",
        Buffer.from(csvContent), "test.csv"
      );

      expect(result.rows[0].value).toBe("=1+1");
    });

    it("preserves standalone '+' without '=' prefix", async () => {
      const csvContent = "phone\n+55 11 99999";
      mockQuery.mockResolvedValue({ rows: [{ id: "org-1" }] });
      mockQuery.mockResolvedValue({ rows: [{ id: "job-1" }] });

      const result = await service.importCSV(
        "test-org", "test-job",
        Buffer.from(csvContent), "test.csv"
      );

      expect(result.rows[0].phone).toBe("+55 11 99999");
    });
  });
});
