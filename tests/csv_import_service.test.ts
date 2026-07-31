import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { CsvImportService } from "../src/services/data_engineering/csv_import_service";
import { query } from "../src/services/db";

const service = new CsvImportService();

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CsvImportService", () => {
  it("importCSV parses CSV and returns result", async () => {
    mockQuery([{ id: "org-1" }]);
    mockQuery([{ id: "job-1" }]);
    const csv = Buffer.from("Name,Value\nAlice,100\nBob,200");
    const result = await service.importCSV("Acme", "test-job", csv, "data.csv");
    expect(result.totalRows).toBe(2);
    expect(result.headers).toEqual(["Name", "Value"]);
    expect(result.rows[0].Name).toBe("Alice");
  });

  it("importCSV handles quoted and escaped fields", async () => {
    mockQuery([{ id: "org-1" }]);
    mockQuery([{ id: "job-2" }]);
    const csv = Buffer.from('"Full Name","Notes"\n"John, Doe","He said ""hello"""');
    const result = await service.importCSV("Acme", "quote-test", csv, "quoted.csv");
    expect(result.rows[0]["Full Name"]).toBe("John, Doe");
    expect(result.rows[0].Notes).toBe('He said "hello"');
  });

  it("getImportJobByName returns formatted job", async () => {
    mockQuery([{ id: "org-1" }]);
    mockQuery([{ name: "job1", filename: "f.csv", status: "completed", error_message: null, created_at: new Date(), processed_at: new Date() }]);
    const result = await service.getImportJobByName("Acme", "job1");
    expect(result!.name).toBe("job1");
    expect(result!.status).toBe("completed");
  });

  it("listImportJobs returns formatted list", async () => {
    mockQuery([{ id: "org-1" }]);
    mockQuery([{ name: "j1", filename: "a.csv", status: "completed", error_message: null, created_at: new Date(), processed_at: null }]);
    const result = await service.listImportJobs("Acme");
    expect(result).toHaveLength(1);
  });

  it("importCSV throws on empty org name", async () => {
    await expect(service.importCSV("", "job", Buffer.from("a\n1"), "f.csv")).rejects.toThrow("organization_name is required");
  });

  it("importCSV throws on empty job name", async () => {
    await expect(service.importCSV("Acme", "", Buffer.from("a\n1"), "f.csv")).rejects.toThrow("import_job_name is required");
  });

  it("importCSV throws on empty file", async () => {
    await expect(service.importCSV("Acme", "job", Buffer.from(""), "f.csv")).rejects.toThrow("file is empty");
  });

  it("importCSV throws on unknown org", async () => {
    mockQuery([]);
    await expect(service.importCSV("Ghost", "job", Buffer.from("a\n1"), "f.csv")).rejects.toThrow("organization not found");
  });
});
