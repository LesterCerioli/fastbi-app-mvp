import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
}));

import { KPIService, type CreateKPIRequest, type KPIFilter, type UpdateKPIRequest, KPIStatus, KPICategory, KPIUnit, AggregationType, ComparisonOperator, ReportingPeriod, type RevenueFilter } from "../src/services/kpis/kpi_service";
import { query } from "../src/services/db";

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("KPIService", () => {
  let service: KPIService;

  const baseCreateReq: CreateKPIRequest = {
    organization_name: "TestOrg",
    code: "REV_GROWTH",
    name: "Revenue Growth",
    description: "Tracks revenue growth over time",
    category: KPICategory.RevenueProfitability,
    unit: KPIUnit.Percentage,
    aggregation: AggregationType.Avg,
    comparison_operator: ComparisonOperator.GreaterThan,
    alert_enabled: false,
    depends_on: [],
    reporting_period: ReportingPeriod.Monthly,
    lookback_days: 30,
    applicable_regions: [],
    applicable_departments: [],
    applicable_business_units: [],
    required_roles: [],
    view_permissions: {},
  };

  const mockKPIRow = {
    id: "kpi-1",
    organization_id: "org-1",
    code: "REV_GROWTH",
    name: "Revenue Growth",
    description: "Tracks revenue growth over time",
    category: "financial",
    unit: "percentage",
    aggregation: "avg",
    target_value: null,
    target_min: null,
    target_max: null,
    comparison_operator: "greater_than",
    alert_threshold: null,
    alert_enabled: false,
    alert_severity: null,
    calculation_query: "",
    calculation_schema: {},
    depends_on: "{}",
    reporting_period: "monthly",
    lookback_days: 30,
    applicable_regions: "{}",
    applicable_departments: "{}",
    applicable_business_units: "{}",
    required_roles: "{}",
    view_permissions: {},
    status: "draft",
    version: 1,
    created_by: null,
    updated_by: null,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    last_calculated_at: null,
    last_value: null,
    last_variance_percentage: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KPIService();
  });

  describe("CreateKPI", () => {
    it("creates a KPI and returns full object", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "kpi-1", created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any);

      const result = await service.CreateKPI(baseCreateReq);

      expect(result.code).toBe("REV_GROWTH");
      expect(result.id).toBe("kpi-1");
    });

    it("creates KPI with optional fields like target_value", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "kpi-2", created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, id: "kpi-2", target_value: 100 }] } as any);

      const req = { ...baseCreateReq, target_value: 100 };
      const result = await service.CreateKPI(req);

      expect(result.id).toBe("kpi-2");
    });

    it("serializes calculation_schema and view_permissions as JSON", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "kpi-3", created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, id: "kpi-3" }] } as any);

      const req = { ...baseCreateReq, calculation_schema: { formula: "a + b" }, view_permissions: { role: "admin" } };
      await service.CreateKPI(req);

      const insertParams = mockQuery.mock.calls[1][1] as any[];
      expect(JSON.parse(insertParams[15])).toEqual({ formula: "a + b" });
    });

    it("creates history entry on successful creation", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "kpi-4", created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, id: "kpi-4" }] } as any);

      await service.CreateKPI(baseCreateReq);

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it("throws when organization_name is missing", async () => {
      await expect(service.CreateKPI({ ...baseCreateReq, organization_name: "" })).rejects.toThrow("organization_name is required");
    });

    it("throws when code is missing", async () => {
      await expect(service.CreateKPI({ ...baseCreateReq, code: "" })).rejects.toThrow("code is required");
    });

    it("throws when name is missing", async () => {
      await expect(service.CreateKPI({ ...baseCreateReq, name: "" })).rejects.toThrow("name is required");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.CreateKPI(baseCreateReq)).rejects.toThrow("organization not found with name");
    });
  });

  describe("GetKPIByID", () => {
    it("returns KPI when found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockKPIRow] } as any);

      const result = await service.GetKPIByID("kpi-1", "org-1");

      expect(result.id).toBe("kpi-1");
      expect(result.code).toBe("REV_GROWTH");
    });

    it("throws when KPI not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.GetKPIByID("invalid", "org-1")).rejects.toThrow("KPI not found");
    });

    it("parses JSON fields correctly", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockKPIRow, depends_on: "{}", applicable_regions: "{US,EU}", view_permissions: "{}" }] } as any);

      const result = await service.GetKPIByID("kpi-1", "org-1");

      expect(result.depends_on).toEqual([]);
    });

    it("parses string arrays from PostgreSQL format", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockKPIRow, depends_on: "{kpi_a,kpi_b}" }] } as any);

      const result = await service.GetKPIByID("kpi-1", "org-1");

      expect(result.depends_on).toContain("kpi_a");
    });

    it("handles null numeric fields", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockKPIRow, last_value: null, last_variance_percentage: null }] } as any);

      const result = await service.GetKPIByID("kpi-1", "org-1");

      expect(result.last_value).toBeNull();
    });

    it("maps all enum fields correctly", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockKPIRow, category: "financial", unit: "percentage", aggregation: "avg", status: "draft" }] } as any);

      const result = await service.GetKPIByID("kpi-1", "org-1");

      expect(result.category).toBe("financial");
      expect(result.status).toBe("draft");
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.GetKPIByID("kpi-1", "org-1")).rejects.toThrow("db error");
    });

    it("handles empty calculation_schema", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockKPIRow, calculation_schema: null }] } as any);

      const result = await service.GetKPIByID("kpi-1", "org-1");

      expect(result.calculation_schema).toEqual({});
    });
  });

  describe("ListKPIs", () => {
    it("returns paginated KPI list with total count", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "1" }] } as any)
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any);

      const filter: KPIFilter = { organization_name: "TestOrg" };
      const [kpis, total] = await service.ListKPIs(filter);

      expect(kpis).toHaveLength(1);
      expect(total).toBe(1);
    });

    it("applies category filter when provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const filter: KPIFilter = { organization_name: "TestOrg", category: KPICategory.RevenueProfitability };
      const [kpis] = await service.ListKPIs(filter);

      expect(kpis).toHaveLength(0);
    });

    it("applies status filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const filter: KPIFilter = { organization_name: "TestOrg", status: KPIStatus.Active };
      await service.ListKPIs(filter);

      expect(mockQuery.mock.calls[1][0]).toContain("status");
    });

    it("applies code ILIKE filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const filter: KPIFilter = { organization_name: "TestOrg", code: "REV" };
      await service.ListKPIs(filter);

      expect(mockQuery.mock.calls[1][0]).toContain("ILIKE");
    });

    it("uses default pagination when not provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const filter: KPIFilter = { organization_name: "TestOrg" };
      await service.ListKPIs(filter);

      const dataCall = mockQuery.mock.calls[2][1] as any[];
      expect(dataCall[dataCall.length - 2]).toBe(20);
      expect(dataCall[dataCall.length - 1]).toBe(0);
    });

    it("throws when organization not found for name filter", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.ListKPIs({ organization_name: "Unknown" })).rejects.toThrow("organization not found");
    });

    it("handles no organization_name filter without resolving", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const [kpis] = await service.ListKPIs({});

      expect(kpis).toHaveLength(0);
    });

    it("handles null alert_enabled filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await service.ListKPIs({ organization_name: "TestOrg", alert_enabled: true });

      expect(mockQuery.mock.calls[1][0]).toContain("alert_enabled");
    });

    it("propagates database errors on count query", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockRejectedValueOnce(new Error("count error"));

      await expect(service.ListKPIs({ organization_name: "TestOrg" })).rejects.toThrow("count error");
    });
  });

  describe("CalculateRevenueKPI", () => {
    const revenueFilter: RevenueFilter = {
      organization_name: "TestOrg",
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-12-31"),
    };

    it("returns full RevenueMetrics with all breakdowns", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", customer_count: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "80000", customer_count: "40" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "90000", customer_count: "45" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "85000", customer_count: "42" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "75000", customer_count: "38" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "US", revenue: "60000" }, { dimension_value: "EU", revenue: "40000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "BU1", revenue: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "Prod1", revenue: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ customer_id: "c1", customer_name: "Cust A", revenue: "50000" }, { customer_id: "c2", customer_name: "Cust B", revenue: "30000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ period: "2024-01-01", revenue: "50000", transaction_count: "100", timestamp: new Date() }] } as any);

      const result = await service.CalculateRevenueKPI(revenueFilter);

      expect(result.total_revenue).toBe(100000);
      expect(result.revenue_by_region).toHaveProperty("US");
      expect(result.top_customers).toHaveLength(2);
    });

    it("returns zero values when no revenue data", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any);

      const result = await service.CalculateRevenueKPI(revenueFilter);

      expect(result.growth_rate).toBe(0);
      expect(result.alerts).toHaveLength(0);
    });

    it("throws when organization_name is empty", async () => {
      await expect(service.CalculateRevenueKPI({ ...revenueFilter, organization_name: "" })).rejects.toThrow("organization_name is required");
    });

    it("throws when dates are missing", async () => {
      await expect(service.CalculateRevenueKPI({ ...revenueFilter, start_date: null as any })).rejects.toThrow("start_date and end_date are required");
      await expect(service.CalculateRevenueKPI({ ...revenueFilter, end_date: null as any })).rejects.toThrow("start_date and end_date are required");
    });

    it("handles errors in sub-queries gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", customer_count: "50" }] } as any)
        .mockRejectedValueOnce(new Error("previous query failed"));

      const result = await service.CalculateRevenueKPI(revenueFilter);

      expect(result.total_revenue).toBe(100000);
    });

    it("handles errors in revenue by dimension gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", customer_count: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "80000", customer_count: "40" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "90000", customer_count: "45" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "85000", customer_count: "42" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "75000", customer_count: "38" }] } as any)
        .mockRejectedValueOnce(new Error("region query failed"));

      const result = await service.CalculateRevenueKPI(revenueFilter);

      expect(result.total_revenue).toBe(100000);
    });

    it("generates alerts for revenue decline > 20%", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "50000", customer_count: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", customer_count: "100" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any);

      const result = await service.CalculateRevenueKPI(revenueFilter);

      expect(result.alerts.some((a) => a.type === "critical")).toBe(true);
    });

    it("propagates database errors on main query", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockRejectedValueOnce(new Error("main query error"));

      await expect(service.CalculateRevenueKPI(revenueFilter)).rejects.toThrow("main query error");
    });
  });

  describe("UpdateKPI", () => {
    it("updates KPI name and returns updated object", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, name: "Updated Name" }] } as any);

      const req: UpdateKPIRequest = { name: "Updated Name", organization_name: "TestOrg" };
      const result = await service.UpdateKPI("kpi-1", "org-1", req);

      expect(result.name).toBe("Updated Name");
    });

    it("updates KPI status", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, status: "active" }] } as any);

      const req: UpdateKPIRequest = { status: KPIStatus.Active, organization_name: "TestOrg" };
      const result = await service.UpdateKPI("kpi-1", "org-1", req);

      expect(result.status).toBe("active");
    });

    it("returns current KPI when no updates provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockKPIRow] } as any);

      const req: UpdateKPIRequest = { organization_name: "TestOrg" };
      const result = await service.UpdateKPI("kpi-1", "org-1", req);

      expect(result.name).toBe("Revenue Growth");
    });

    it("creates history entry on successful update", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, name: "Updated" }] } as any);

      const req: UpdateKPIRequest = { name: "Updated", organization_name: "TestOrg" };
      await service.UpdateKPI("kpi-1", "org-1", req);

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it("throws when KPI not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const req: UpdateKPIRequest = { name: "Updated", organization_name: "TestOrg" };
      await expect(service.UpdateKPI("invalid", "org-1", req)).rejects.toThrow("KPI not found");
    });

    it("throws when update fails to return rows", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req: UpdateKPIRequest = { name: "Updated", organization_name: "TestOrg" };
      await expect(service.UpdateKPI("kpi-1", "org-1", req)).rejects.toThrow("failed to update KPI");
    });

    it("increments version on update", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [{ updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockKPIRow, version: 2 }] } as any);

      const req: UpdateKPIRequest = { name: "Updated", organization_name: "TestOrg" };
      const result = await service.UpdateKPI("kpi-1", "org-1", req);

      expect(mockQuery.mock.calls[1][0]).toContain("version = version + 1");
    });

    it("propagates database errors", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockRejectedValueOnce(new Error("update failed"));

      const req: UpdateKPIRequest = { name: "Updated", organization_name: "TestOrg" };
      await expect(service.UpdateKPI("kpi-1", "org-1", req)).rejects.toThrow("update failed");
    });
  });

  describe("DeleteKPI", () => {
    it("archives KPI and creates history entry", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await service.DeleteKPI("kpi-1", "org-1");

      expect(mockQuery.mock.calls[1][0]).toContain("UPDATE");
      expect(mockQuery.mock.calls[1][1]).toContain("inactive");
    });

    it("throws when KPI not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.DeleteKPI("invalid", "org-1")).rejects.toThrow("KPI not found");
    });

    it("propagates database errors on archive", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockRejectedValueOnce(new Error("archive failed"));

      await expect(service.DeleteKPI("kpi-1", "org-1")).rejects.toThrow("archive failed");
    });

    it("handles history entry error gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockRejectedValueOnce(new Error("history error"));

      await expect(service.DeleteKPI("kpi-1", "org-1")).resolves.not.toThrow();
    });

    it("includes deletedBy and reason in history", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockKPIRow] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await service.DeleteKPI("kpi-1", "org-1", "user-1", "No longer needed");

      expect(mockQuery.mock.calls[1][1]).toContain("No longer needed");
    });
  });

  describe("GetKPIHistory", () => {
    it("returns history records with total count", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "2" }] } as any)
        .mockResolvedValueOnce({ rows: [{ version: 1, changed_at: new Date(), change_reason: "Initial" }, { version: 2, changed_at: new Date(), change_reason: "Updated" }] } as any);

      const [history, total] = await service.GetKPIHistory("kpi-1", "org-1");

      expect(history).toHaveLength(2);
      expect(total).toBe(2);
    });

    it("returns empty history when no records", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const [history, total] = await service.GetKPIHistory("kpi-1", "org-1");

      expect(history).toHaveLength(0);
      expect(total).toBe(0);
    });

    it("handles negative limit by defaulting to 50", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await service.GetKPIHistory("kpi-1", "org-1", -1);

      const dataCall = mockQuery.mock.calls[1][1] as any[];
      expect(dataCall[2]).toBe(50);
    });

    it("handles negative offset by defaulting to 0", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await service.GetKPIHistory("kpi-1", "org-1", 10, -5);

      const dataCall = mockQuery.mock.calls[1][1] as any[];
      expect(dataCall[3]).toBe(0);
    });

    it("only includes non-null fields in entries", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ version: 1, name: null, description: null, target_value: null, changed_at: new Date(), change_reason: "Initial" }] } as any);

      const [history] = await service.GetKPIHistory("kpi-1", "org-1");

      const entry = history[0];
      expect(entry.name).toBeUndefined();
      expect(entry.version).toBe(1);
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.GetKPIHistory("kpi-1", "org-1")).rejects.toThrow("db error");
    });

    it("includes changed_by when present", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ version: 2, changed_at: new Date(), change_reason: "Updated", changed_by: "user-1" }] } as any);

      const [history] = await service.GetKPIHistory("kpi-1", "org-1");

      expect(history[0].changed_by).toBe("user-1");
    });
  });

  describe("ResolveKPIIDByCode", () => {
    it("returns kpi_id and org_id for valid code", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "kpi-1" }] } as any);

      const result = await service.ResolveKPIIDByCode("REV_GROWTH", "TestOrg");

      expect(result.kpi_id).toBe("kpi-1");
      expect(result.org_id).toBe("org-1");
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.ResolveKPIIDByCode("REV_GROWTH", "Unknown")).rejects.toThrow("organization not found");
    });

    it("throws when KPI code not found", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.ResolveKPIIDByCode("INVALID", "TestOrg")).rejects.toThrow("KPI not found");
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.ResolveKPIIDByCode("REV_GROWTH", "TestOrg")).rejects.toThrow("db error");
    });
  });

  describe("GetExecutiveRevenueReport", () => {
    it("returns report for monthly period", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", customer_count: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "80000", customer_count: "40" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "90000", customer_count: "45" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "85000", customer_count: "42" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "75000", customer_count: "38" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "US", revenue: "60000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "BU1", revenue: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "Prod1", revenue: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ customer_id: "c1", customer_name: "Cust A", revenue: "50000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ period: "2024-01-01", revenue: "50000", transaction_count: "100", timestamp: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "100000", customer_count: "50" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "80000", customer_count: "40" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "90000", customer_count: "45" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "85000", customer_count: "42" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "75000", customer_count: "38" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "US", revenue: "60000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "BU1", revenue: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ dimension_value: "Prod1", revenue: "100000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ customer_id: "c1", customer_name: "Cust A", revenue: "50000" }] } as any)
        .mockResolvedValueOnce({ rows: [{ period: "2024-01-01", revenue: "50000", transaction_count: "100", timestamp: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ total_revenue: "0", customer_count: "0" }] } as any);

      const result = await service.GetExecutiveRevenueReport("TestOrg", "monthly");

      expect(result.report_type).toBe("executive_revenue");
      expect(result.period).toBe("monthly");
    });
  });
});
