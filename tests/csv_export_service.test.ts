import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn() }));

import { CsvExportService, sanitizeCSVCell, CSVExportProfile, FieldMapping } from "../src/services/data_engineering/csv_export_service";
import { query } from "../src/services/db";

function mockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CsvExportService", () => {
  const service = new CsvExportService("https://example.com");
  const profile: CSVExportProfile = {
    fields: [
      { sourceField: "name", columnHeader: "Name", formatType: "string" },
      { sourceField: "value", columnHeader: "Value", formatType: "number" },
    ],
    delimiter: ",",
    encoding: "utf-8",
    dateFormat: "ISOString",
    numberFormat: "plain",
    nullValue: "",
  };

  it("export generates CSV artifact", async () => {
    mockQuery([{ id: "art-1" }]);
    const data = [{ name: "Alice", value: 100 }, { name: "Bob", value: 200 }];
    const result = await service.export("run-1", "org-1", profile, data);
    expect(result.url).toContain("download");
    expect(result.rowCount).toBe(2);
    expect(result.filename).toBe("report_run-1.csv");
  });

  it("export uses field mappings from profile", async () => {
    mockQuery([{ id: "art-1" }]);
    const data = [{ name: "Test", value: 50 }];
    const result = await service.export("run-2", "org-1", profile, data);
    expect(result.rowCount).toBe(1);
  });

  it("upsertProfile inserts profile", async () => {
    mockQuery([]);
    await service.upsertProfile("org-1", "tpl-1", profile);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("getProfile returns parsed profile", async () => {
    mockQuery([{ profile_config: JSON.stringify(profile) }]);
    const result = await service.getProfile("org-1", "tpl-1");
    expect(result!.delimiter).toBe(",");
  });

  it("export handles empty data array", async () => {
    mockQuery([{ id: "art-1" }]);
    const result = await service.export("run-3", "org-1", profile, []);
    expect(result.rowCount).toBe(0);
  });

  it("getProfile throws when not found", async () => {
    mockQuery([]);
    await expect(service.getProfile("org-1", "nope")).rejects.toThrow("CSV export profile not found");
  });

  it("getArtifactBytes throws when not found", async () => {
    mockQuery([]);
    await expect(service.getArtifactBytes("no-run")).rejects.toThrow("CSV artifact not found");
  });

  it("resolveOrganizationID throws for missing org", async () => {
    mockQuery([]);
    await expect(service.resolveOrganizationID("Ghost")).rejects.toThrow("organization not found");
  });
});

describe("sanitizeCSVCell", () => {
  it("prefixes = with single quote", () => {
    expect(sanitizeCSVCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
  });

  it("prefixes + with single quote", () => {
    expect(sanitizeCSVCell("+1+1")).toBe("'+1+1");
  });

  it("prefixes - with single quote", () => {
    expect(sanitizeCSVCell("-1+2")).toBe("'-1+2");
  });

  it("prefixes @ with single quote", () => {
    expect(sanitizeCSVCell("@DDE")).toBe("'@DDE");
  });

  it("does not modify normal strings", () => {
    expect(sanitizeCSVCell("hello")).toBe("hello");
  });

  it("does not modify empty string", () => {
    expect(sanitizeCSVCell("")).toBe("");
  });

  it("prefixes tab", () => {
    expect(sanitizeCSVCell("\tdata")).toBe("'\tdata");
  });

  it("prefixes carriage return", () => {
    expect(sanitizeCSVCell("\rdata")).toBe("'\rdata");
  });
});
