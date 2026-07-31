import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));

import { AccountingWorkflowEngineService, AllowedAccountingCategories, TaxRegimes, FiscalPeriods, RegulatoryBodies } from "../src/services/accounting/accounting_workflow_engine_service";
import { query } from "../src/services/db";

const service = new AccountingWorkflowEngineService();

function makeMockQuery(rows: unknown[]) {
  return jest.mocked(query).mockResolvedValueOnce({ rows } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AccountingWorkflowEngineService", () => {
  const validStructure = {
    stages: [
      { name: "collect", probability: 50 },
      { name: "review", probability: 80 },
    ],
    kpis: ["accuracy"],
  };

  // --- Positive ---

  it("createTemplate creates a template successfully", async () => {
    makeMockQuery([
      { id: "t1", name: "Tax Audit", category: "tax_compliance", tax_regime: "lucro_real", fiscal_period: "quarterly", regulatory_body: "receita_federal", structure_json: JSON.stringify(validStructure), created_by: "user1", created_at: new Date(), updated_at: new Date() },
    ]);
    const result = await service.createTemplate("Tax Audit", "tax_compliance", validStructure, "user1", "lucro_real", "quarterly", "receita_federal");
    expect(result.id).toBe("t1");
    expect(result.name).toBe("Tax Audit");
    expect(result.structure.kpis).toEqual(["accuracy"]);
  });

  it("createWorkflowFromTemplate creates workflow from existing template", async () => {
    makeMockQuery([{ structure_json: JSON.stringify(validStructure), name: "Audit Template", fiscal_period: "monthly" }]);
    makeMockQuery([{ id: "org-1" }]);
    makeMockQuery([{ id: "wf-1", organization_id: "org-1", name: "My Workflow", template_id: "t1", fiscal_year: 2025, fiscal_period: "monthly", structure_json: JSON.stringify(validStructure), status: "pending", created_at: new Date(), updated_at: new Date() }]);
    const result = await service.createWorkflowFromTemplate("t1", "MyOrg", 2025);
    expect(result.id).toBe("wf-1");
    expect(result.status).toBe("pending");
  });

  it("getTemplatesByCategory returns templates for valid category", async () => {
    makeMockQuery([{ id: "t1", name: "Template 1", category: "bookkeeping", tax_regime: null, fiscal_period: "monthly", regulatory_body: null, structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date() }]);
    const result = await service.getTemplatesByCategory("bookkeeping");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Template 1");
  });

  it("updateTemplate updates and returns the template", async () => {
    makeMockQuery([{ id: "t1" }]);
    makeMockQuery([{ id: "t1", name: "Updated", category: "auditing", tax_regime: null, fiscal_period: null, regulatory_body: null, structure_json: JSON.stringify(validStructure), created_by: null, created_at: new Date(), updated_at: new Date() }]);
    const result = await service.updateTemplate("t1", { name: "Updated", category: "auditing" });
    expect(result.name).toBe("Updated");
  });

  // --- Negative ---

  it("createTemplate throws on invalid category", async () => {
    await expect(service.createTemplate("Bad", "invalid_category", validStructure)).rejects.toThrow("invalid category");
  });

  it("createWorkflowFromTemplate throws on missing template", async () => {
    makeMockQuery([]);
    await expect(service.createWorkflowFromTemplate("nonexistent", "Org", 2025)).rejects.toThrow("accounting workflow template not found");
  });

  it("getTemplatesByCategory throws on invalid category", async () => {
    await expect(service.getTemplatesByCategory("bogus")).rejects.toThrow("invalid category");
  });

  it("updateTemplate throws on missing template", async () => {
    makeMockQuery([]);
    await expect(service.updateTemplate("missing", { name: "X" })).rejects.toThrow("template not found");
  });
});
