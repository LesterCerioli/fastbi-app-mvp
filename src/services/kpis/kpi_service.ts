import { query } from "../db";

export enum KPIStatus {
  Draft = "draft",
  Active = "active",
  Archived = "archived",
}

export enum KPICategory {
  Financial = "financial",
  Operational = "operational",
  Customer = "customer",
  Sales = "sales",
  Revenue = "revenue",
}

export enum KPIUnit {
  Currency = "currency",
  Percentage = "percentage",
  Number = "number",
  Days = "days",
  Hours = "hours",
  Ratio = "ratio",
}

export enum AggregationType {
  Sum = "sum",
  Avg = "avg",
  Count = "count",
  Min = "min",
  Max = "max",
}

export enum ComparisonOperator {
  GreaterThan = "greater_than",
  GreaterEqual = "greater_equal",
  LessThan = "less_than",
  LessEqual = "less_equal",
  Equal = "equal",
  NotEqual = "not_equal",
  Between = "between",
}

export enum ReportingPeriod {
  Realtime = "realtime",
  Hourly = "hourly",
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
  Quarterly = "quarterly",
  Annual = "annual",
}

export enum AlertSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export interface KPI {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string;
  category: KPICategory;
  unit: KPIUnit;
  aggregation: AggregationType;
  target_value?: number | null;
  target_min?: number | null;
  target_max?: number | null;
  comparison_operator: ComparisonOperator;
  alert_threshold?: number | null;
  alert_enabled: boolean;
  alert_severity?: AlertSeverity | null;
  calculation_query?: string;
  calculation_schema?: Record<string, unknown>;
  depends_on: string[];
  reporting_period: ReportingPeriod;
  lookback_days: number;
  applicable_regions: string[];
  applicable_departments: string[];
  applicable_business_units: string[];
  required_roles: string[];
  view_permissions: Record<string, unknown>;
  status: KPIStatus;
  version: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
  last_calculated_at?: Date | null;
  last_value?: number | null;
  last_variance_percentage?: number | null;
}

export interface KPIFilter {
  organization_name?: string | null;
  category?: KPICategory | null;
  status?: KPIStatus | null;
  code?: string | null;
  name?: string | null;
  reporting_period?: ReportingPeriod | null;
  applicable_region?: string | null;
  applicable_department?: string | null;
  applicable_business_unit?: string | null;
  required_role?: string | null;
  alert_enabled?: boolean | null;
  version?: number | null;
  created_after?: Date | null;
  created_before?: Date | null;
  updated_after?: Date | null;
  updated_before?: Date | null;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: string;
}

export interface RevenueFilter {
  organization_name: string;
  start_date: Date;
  end_date: Date;
  period?: string | null;
  country?: string | null;
  currency?: string | null;
  business_unit?: string | null;
  product?: string | null;
  enterprise_customer?: string | null;
  market_segment?: string | null;
  region?: string | null;
  organization_id?: string;
}

export interface RevenueMetrics {
  total_revenue: number;
  previous_period_revenue: number;
  yoy_growth: number;
  qoq_growth: number;
  mom_growth: number;
  revenue_by_region: Record<string, number>;
  revenue_by_business_unit: Record<string, number>;
  revenue_by_product: Record<string, number>;
  revenue_by_customer: Record<string, number>;
  average_revenue_per_customer: number;
  customer_count: number;
  transaction_count: number;
  top_customers: CustomerRevenue[];
  time_series: TimeSeriesPoint[];
  growth_rate: number;
  is_sustainable: boolean;
  alerts: RevenueAlert[];
}

export interface CustomerRevenue {
  customer_id: string;
  customer_name: string;
  revenue: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  period: string;
  revenue: number;
  count: number;
  timestamp: Date;
}

export interface RevenueAlert {
  type: string;
  severity: string;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
}

export interface KPIValue {
  kpi_id: string;
  value: number;
  variance?: number | null;
  variance_percentage?: number | null;
  target_status: string;
  calculated_at: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateKPIRequest {
  organization_name: string;
  code: string;
  name: string;
  description: string;
  category: KPICategory;
  unit: KPIUnit;
  aggregation: AggregationType;
  target_value?: number | null;
  target_min?: number | null;
  target_max?: number | null;
  comparison_operator: ComparisonOperator;
  alert_threshold?: number | null;
  alert_enabled: boolean;
  alert_severity?: AlertSeverity | null;
  calculation_query?: string;
  calculation_schema?: Record<string, unknown>;
  depends_on: string[];
  reporting_period: ReportingPeriod;
  lookback_days: number;
  applicable_regions: string[];
  applicable_departments: string[];
  applicable_business_units: string[];
  required_roles: string[];
  view_permissions: Record<string, unknown>;
  created_by?: string | null;
}

export interface UpdateKPIRequest {
  name?: string | null;
  description?: string | null;
  category?: KPICategory | null;
  unit?: KPIUnit | null;
  aggregation?: AggregationType | null;
  target_value?: number | null;
  target_min?: number | null;
  target_max?: number | null;
  comparison_operator?: ComparisonOperator | null;
  alert_threshold?: number | null;
  alert_enabled?: boolean | null;
  alert_severity?: AlertSeverity | null;
  calculation_query?: string | null;
  calculation_schema?: Record<string, unknown>;
  depends_on?: string[];
  reporting_period?: ReportingPeriod | null;
  lookback_days?: number | null;
  applicable_regions?: string[];
  applicable_departments?: string[];
  applicable_business_units?: string[];
  required_roles?: string[];
  view_permissions?: Record<string, unknown>;
  organization_name: string;
  status?: KPIStatus | null;
  updated_by?: string | null;
  change_reason?: string | null;
}

export class KPIService {
  private async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (!result.rows[0]) {
      throw new Error(`organization not found with name: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  private async resolveOrganizationIDPtr(organizationName?: string | null): Promise<string | null | undefined> {
    if (!organizationName) return undefined;
    return this.resolveOrganizationID(organizationName);
  }

  async ResolveOrganizationID(organizationName: string): Promise<string> {
    return this.resolveOrganizationID(organizationName);
  }

  async ResolveKPIIDByCode(code: string, organizationName: string): Promise<{ kpi_id: string; org_id: string }> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const result = await query(
      `SELECT id FROM public.kpis WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [code, orgID]
    );
    if (!result.rows[0]) {
      throw new Error("KPI not found");
    }
    return { kpi_id: result.rows[0].id, org_id: orgID };
  }

  async CreateKPI(req: CreateKPIRequest): Promise<KPI> {
    if (!req.organization_name) throw new Error("organization_name is required");
    if (!req.code) throw new Error("code is required");
    if (!req.name) throw new Error("name is required");

    const organizationID = await this.resolveOrganizationID(req.organization_name);

    const calculationSchemaJSON = JSON.stringify(req.calculation_schema || {});
    const viewPermissionsJSON = JSON.stringify(req.view_permissions || {});
    const dependsOnArray = this.stringSliceToNullStringArray(req.depends_on || []);
    const applicableRegionsArray = this.stringSliceToNullStringArray(req.applicable_regions || []);
    const applicableDepartmentsArray = this.stringSliceToNullStringArray(req.applicable_departments || []);
    const applicableBusinessUnitsArray = this.stringSliceToNullStringArray(req.applicable_business_units || []);
    const requiredRolesArray = this.stringSliceToNullStringArray(req.required_roles || []);

    const result = await query(
      `INSERT INTO public.kpis (
        organization_id, code, name, description, category, unit, aggregation,
        target_value, target_min, target_max, comparison_operator, alert_threshold,
        alert_enabled, alert_severity, calculation_query, calculation_schema,
        depends_on, reporting_period, lookback_days, applicable_regions,
        applicable_departments, applicable_business_units, required_roles,
        view_permissions, status, version, created_by, updated_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, created_at, updated_at`,
      [
        organizationID, req.code, req.name, req.description, req.category, req.unit, req.aggregation,
        req.target_value || null, req.target_min || null, req.target_max || null, req.comparison_operator, req.alert_threshold || null,
        req.alert_enabled, req.alert_severity || null, req.calculation_query || "", calculationSchemaJSON,
        dependsOnArray, req.reporting_period, req.lookback_days, applicableRegionsArray,
        applicableDepartmentsArray, applicableBusinessUnitsArray, requiredRolesArray,
        viewPermissionsJSON, KPIStatus.Draft, 1, req.created_by || null, req.created_by || null,
      ]
    );

    const { id, created_at, updated_at } = result.rows[0];

    try {
      await this.createHistoryEntry(id, organizationID, 1, "created", req.created_by || null, "Initial creation");
    } catch (err) {
      console.warn(`Warning: failed to create history entry: ${err}`);
    }

    return this.GetKPIByID(id, organizationID);
  }

  async GetKPIByID(id: string, organizationID: string): Promise<KPI> {
    const result = await query(
      `SELECT id, organization_id, code, name, description, category, unit, aggregation,
              target_value, target_min, target_max, comparison_operator, alert_threshold,
              alert_enabled, alert_severity, calculation_query, calculation_schema,
              depends_on, reporting_period, lookback_days, applicable_regions,
              applicable_departments, applicable_business_units, required_roles,
              view_permissions, status, version, created_by, updated_by, created_at,
              updated_at, last_calculated_at, last_value, last_variance_percentage
       FROM public.kpis
       WHERE id = $1 AND organization_id = $2`,
      [id, organizationID]
    );

    if (!result.rows[0]) {
      throw new Error("KPI not found");
    }

    return this.mapRowToKPI(result.rows[0]);
  }

  async ListKPIs(filter: KPIFilter): Promise<[KPI[], number]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramCounter = 1;

    if (filter.organization_name) {
      const resolvedID = await this.resolveOrganizationID(filter.organization_name);
      conditions.push(`organization_id = $${paramCounter++}`);
      params.push(resolvedID);
    }

    if (filter.category) {
      conditions.push(`category = $${paramCounter++}`);
      params.push(filter.category);
    }
    if (filter.status) {
      conditions.push(`status = $${paramCounter++}`);
      params.push(filter.status);
    }
    if (filter.code) {
      conditions.push(`code ILIKE $${paramCounter++}`);
      params.push(`%${filter.code}%`);
    }
    if (filter.name) {
      conditions.push(`name ILIKE $${paramCounter++}`);
      params.push(`%${filter.name}%`);
    }
    if (filter.reporting_period) {
      conditions.push(`reporting_period = $${paramCounter++}`);
      params.push(filter.reporting_period);
    }
    if (filter.applicable_region) {
      conditions.push(`$${paramCounter++} = ANY(applicable_regions)`);
      params.push(filter.applicable_region);
    }
    if (filter.applicable_department) {
      conditions.push(`$${paramCounter++} = ANY(applicable_departments)`);
      params.push(filter.applicable_department);
    }
    if (filter.applicable_business_unit) {
      conditions.push(`$${paramCounter++} = ANY(applicable_business_units)`);
      params.push(filter.applicable_business_unit);
    }
    if (filter.required_role) {
      conditions.push(`$${paramCounter++} = ANY(required_roles)`);
      params.push(filter.required_role);
    }
    if (filter.alert_enabled !== undefined && filter.alert_enabled !== null) {
      conditions.push(`alert_enabled = $${paramCounter++}`);
      params.push(filter.alert_enabled);
    }
    if (filter.version !== undefined && filter.version !== null) {
      conditions.push(`version = $${paramCounter++}`);
      params.push(filter.version);
    }
    if (filter.created_after) {
      conditions.push(`created_at >= $${paramCounter++}`);
      params.push(filter.created_after);
    }
    if (filter.created_before) {
      conditions.push(`created_at <= $${paramCounter++}`);
      params.push(filter.created_before);
    }
    if (filter.updated_after) {
      conditions.push(`updated_at >= $${paramCounter++}`);
      params.push(filter.updated_after);
    }
    if (filter.updated_before) {
      conditions.push(`updated_at <= $${paramCounter++}`);
      params.push(filter.updated_before);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const countResult = await query(
      `SELECT COUNT(*) as count FROM public.kpis ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const orderBy = filter.order_by || "created_at";
    const orderDir = filter.order_dir || "DESC";
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const offset = filter.offset && filter.offset > 0 ? filter.offset : 0;

    const dataResult = await query(
      `SELECT id, organization_id, code, name, description, category, unit, aggregation,
              target_value, target_min, target_max, comparison_operator, alert_threshold,
              alert_enabled, alert_severity, calculation_query, calculation_schema,
              depends_on, reporting_period, lookback_days, applicable_regions,
              applicable_departments, applicable_business_units, required_roles,
              view_permissions, status, version, created_by, updated_by, created_at,
              updated_at, last_calculated_at, last_value, last_variance_percentage
       FROM public.kpis
       ${whereClause}
       ORDER BY ${orderBy} ${orderDir}
       LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      [...params, limit, offset]
    );

    const kpis: KPI[] = dataResult.rows.map((row: Record<string, unknown>) => this.mapRowToKPI(row));
    return [kpis, total];
  }

  async UpdateKPI(id: string, organizationID: string, req: UpdateKPIRequest): Promise<KPI> {
    const currentKPI = await this.GetKPIByID(id, organizationID);

    const setParts: string[] = [];
    const params: unknown[] = [];
    let paramCounter = 1;

    if (req.name !== undefined && req.name !== null) {
      setParts.push(`name = $${paramCounter++}`);
      params.push(req.name);
    }
    if (req.description !== undefined && req.description !== null) {
      setParts.push(`description = $${paramCounter++}`);
      params.push(req.description);
    }
    if (req.category !== undefined && req.category !== null) {
      setParts.push(`category = $${paramCounter++}`);
      params.push(req.category);
    }
    if (req.unit !== undefined && req.unit !== null) {
      setParts.push(`unit = $${paramCounter++}`);
      params.push(req.unit);
    }
    if (req.aggregation !== undefined && req.aggregation !== null) {
      setParts.push(`aggregation = $${paramCounter++}`);
      params.push(req.aggregation);
    }
    if (req.target_value !== undefined && req.target_value !== null) {
      setParts.push(`target_value = $${paramCounter++}`);
      params.push(req.target_value);
    }
    if (req.target_min !== undefined && req.target_min !== null) {
      setParts.push(`target_min = $${paramCounter++}`);
      params.push(req.target_min);
    }
    if (req.target_max !== undefined && req.target_max !== null) {
      setParts.push(`target_max = $${paramCounter++}`);
      params.push(req.target_max);
    }
    if (req.comparison_operator !== undefined && req.comparison_operator !== null) {
      setParts.push(`comparison_operator = $${paramCounter++}`);
      params.push(req.comparison_operator);
    }
    if (req.alert_threshold !== undefined && req.alert_threshold !== null) {
      setParts.push(`alert_threshold = $${paramCounter++}`);
      params.push(req.alert_threshold);
    }
    if (req.alert_enabled !== undefined && req.alert_enabled !== null) {
      setParts.push(`alert_enabled = $${paramCounter++}`);
      params.push(req.alert_enabled);
    }
    if (req.alert_severity !== undefined && req.alert_severity !== null) {
      setParts.push(`alert_severity = $${paramCounter++}`);
      params.push(req.alert_severity);
    }
    if (req.calculation_query !== undefined && req.calculation_query !== null) {
      setParts.push(`calculation_query = $${paramCounter++}`);
      params.push(req.calculation_query);
    }
    if (req.calculation_schema !== undefined) {
      setParts.push(`calculation_schema = $${paramCounter++}`);
      params.push(JSON.stringify(req.calculation_schema));
    }
    if (req.depends_on !== undefined) {
      setParts.push(`depends_on = $${paramCounter++}`);
      params.push(this.stringSliceToNullStringArray(req.depends_on));
    }
    if (req.reporting_period !== undefined && req.reporting_period !== null) {
      setParts.push(`reporting_period = $${paramCounter++}`);
      params.push(req.reporting_period);
    }
    if (req.lookback_days !== undefined && req.lookback_days !== null) {
      setParts.push(`lookback_days = $${paramCounter++}`);
      params.push(req.lookback_days);
    }
    if (req.applicable_regions !== undefined) {
      setParts.push(`applicable_regions = $${paramCounter++}`);
      params.push(this.stringSliceToNullStringArray(req.applicable_regions));
    }
    if (req.applicable_departments !== undefined) {
      setParts.push(`applicable_departments = $${paramCounter++}`);
      params.push(this.stringSliceToNullStringArray(req.applicable_departments));
    }
    if (req.applicable_business_units !== undefined) {
      setParts.push(`applicable_business_units = $${paramCounter++}`);
      params.push(this.stringSliceToNullStringArray(req.applicable_business_units));
    }
    if (req.required_roles !== undefined) {
      setParts.push(`required_roles = $${paramCounter++}`);
      params.push(this.stringSliceToNullStringArray(req.required_roles));
    }
    if (req.view_permissions !== undefined) {
      setParts.push(`view_permissions = $${paramCounter++}`);
      params.push(JSON.stringify(req.view_permissions));
    }
    if (req.status !== undefined && req.status !== null) {
      setParts.push(`status = $${paramCounter++}`);
      params.push(req.status);
    }
    if (req.updated_by !== undefined && req.updated_by !== null) {
      setParts.push(`updated_by = $${paramCounter++}`);
      params.push(req.updated_by);
    }

    setParts.push("version = version + 1");
    setParts.push("updated_at = CURRENT_TIMESTAMP");

    if (setParts.length === 2) {
      return currentKPI;
    }

    const updateResult = await query(
      `UPDATE public.kpis SET ${setParts.join(", ")} WHERE id = $${paramCounter} AND organization_id = $${paramCounter + 1} RETURNING updated_at`,
      [...params, id, organizationID]
    );

    if (!updateResult.rows[0]) {
      throw new Error("failed to update KPI");
    }

    const changeReason = req.change_reason || "Updated";
    try {
      await this.createHistoryEntry(id, organizationID, currentKPI.version + 1, "updated", req.updated_by || null, changeReason);
    } catch (err) {
      console.warn(`Warning: failed to create history entry: ${err}`);
    }

    return this.GetKPIByID(id, organizationID);
  }

  async DeleteKPI(id: string, organizationID: string, deletedBy?: string | null, reason?: string): Promise<void> {
    const currentKPI = await this.GetKPIByID(id, organizationID);

    await query(
      `UPDATE public.kpis SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 AND organization_id = $4`,
      [KPIStatus.Archived, deletedBy || null, id, organizationID]
    );

    try {
      await this.createHistoryEntry(id, organizationID, currentKPI.version + 1, "deleted", deletedBy || null, reason || "Deleted");
    } catch (err) {
      console.warn(`Warning: failed to create history entry for deletion: ${err}`);
    }
  }

  async GetKPIHistory(kpiID: string, organizationID: string, limit = 50, offset = 0): Promise<[Record<string, unknown>[], number]> {
    const countResult = await query(
      `SELECT COUNT(*) as count FROM public.kpi_history WHERE kpi_id = $1 AND organization_id = $2`,
      [kpiID, organizationID]
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    if (limit <= 0) limit = 50;
    if (offset < 0) offset = 0;

    const result = await query(
      `SELECT id, kpi_id, version, name, description, target_value, target_min, target_max,
              alert_threshold, calculation_query, calculation_schema, depends_on,
              reporting_period, lookback_days, applicable_regions, applicable_departments,
              applicable_business_units, required_roles, view_permissions, status,
              changed_by, changed_at, change_reason
       FROM public.kpi_history
       WHERE kpi_id = $1 AND organization_id = $2
       ORDER BY changed_at DESC
       LIMIT $3 OFFSET $4`,
      [kpiID, organizationID, limit, offset]
    );

    const history: Record<string, unknown>[] = result.rows.map((row: Record<string, unknown>) => {
      const entry: Record<string, unknown> = {
        version: row.version,
        changed_at: row.changed_at,
        change_reason: row.change_reason,
      };
      if (row.name) entry.name = row.name;
      if (row.description) entry.description = row.description;
      if (row.target_value !== null) entry.target_value = row.target_value;
      if (row.target_min !== null) entry.target_min = row.target_min;
      if (row.target_max !== null) entry.target_max = row.target_max;
      if (row.alert_threshold !== null) entry.alert_threshold = row.alert_threshold;
      if (row.status) entry.status = row.status;
      if (row.changed_by) entry.changed_by = row.changed_by;
      return entry;
    });

    return [history, total];
  }

  async CalculateRevenueKPI(filter: RevenueFilter): Promise<RevenueMetrics> {
    if (!filter.organization_name) throw new Error("organization_name is required");
    if (!filter.start_date || !filter.end_date) throw new Error("start_date and end_date are required");

    const organizationID = await this.resolveOrganizationID(filter.organization_name);
    filter.organization_id = organizationID;

    const [currentRevenue, currentCount] = await this.calculateRevenue(filter);

    const previousFilter: RevenueFilter = {
      ...filter,
      organization_id: organizationID,
      start_date: new Date(filter.start_date.getTime() - (filter.end_date.getTime() - filter.start_date.getTime())),
      end_date: filter.start_date,
    };
    let previousRevenue = 0;
    try {
      [previousRevenue] = await this.calculateRevenue(previousFilter);
    } catch (err) {
      console.warn(`Warning: failed to calculate previous revenue: ${err}`);
    }

    const yoyFilter: RevenueFilter = {
      ...filter,
      organization_id: organizationID,
      start_date: new Date(filter.start_date.getFullYear() - 1, filter.start_date.getMonth(), filter.start_date.getDate()),
      end_date: new Date(filter.end_date.getFullYear() - 1, filter.end_date.getMonth(), filter.end_date.getDate()),
    };
    let yoyRevenue = 0;
    try {
      [yoyRevenue] = await this.calculateRevenue(yoyFilter);
    } catch (err) {
      console.warn(`Warning: failed to calculate YoY revenue: ${err}`);
    }

    const qoqFilter: RevenueFilter = {
      ...filter,
      organization_id: organizationID,
      start_date: new Date(filter.start_date.getFullYear(), filter.start_date.getMonth() - 3, filter.start_date.getDate()),
      end_date: new Date(filter.end_date.getFullYear(), filter.end_date.getMonth() - 3, filter.end_date.getDate()),
    };
    let qoqRevenue = 0;
    try {
      [qoqRevenue] = await this.calculateRevenue(qoqFilter);
    } catch (err) {
      console.warn(`Warning: failed to calculate QoQ revenue: ${err}`);
    }

    const momFilter: RevenueFilter = {
      ...filter,
      organization_id: organizationID,
      start_date: new Date(filter.start_date.getFullYear(), filter.start_date.getMonth() - 1, filter.start_date.getDate()),
      end_date: new Date(filter.end_date.getFullYear(), filter.end_date.getMonth() - 1, filter.end_date.getDate()),
    };
    let momRevenue = 0;
    try {
      [momRevenue] = await this.calculateRevenue(momFilter);
    } catch (err) {
      console.warn(`Warning: failed to calculate MoM revenue: ${err}`);
    }

    let revenueByRegion: Record<string, number> = {};
    try {
      revenueByRegion = await this.calculateRevenueByDimension(filter, "region");
    } catch (err) {
      console.warn(`Warning: failed to calculate revenue by region: ${err}`);
    }

    let revenueByBusinessUnit: Record<string, number> = {};
    try {
      revenueByBusinessUnit = await this.calculateRevenueByDimension(filter, "business_unit");
    } catch (err) {
      console.warn(`Warning: failed to calculate revenue by business unit: ${err}`);
    }

    let revenueByProduct: Record<string, number> = {};
    try {
      revenueByProduct = await this.calculateRevenueByDimension(filter, "product");
    } catch (err) {
      console.warn(`Warning: failed to calculate revenue by product: ${err}`);
    }

    let revenueByCustomer: Record<string, number> = {};
    let topCustomers: CustomerRevenue[] = [];
    try {
      [revenueByCustomer, topCustomers] = await this.calculateRevenueByCustomer(filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate revenue by customer: ${err}`);
    }

    let timeSeries: TimeSeriesPoint[] = [];
    try {
      timeSeries = await this.calculateTimeSeries(filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate time series: ${err}`);
    }

    const periodYears = (filter.end_date.getTime() - filter.start_date.getTime()) / (24 * 365 * 60 * 60 * 1000);
    let growthRate = 0;
    if (previousRevenue > 0 && periodYears > 0) {
      growthRate = (currentRevenue / previousRevenue - 1) * 100;
    }

    const isSustainable = this.isGrowthSustainable(growthRate, revenueByCustomer, topCustomers);
    const alerts = this.generateRevenueAlerts(currentRevenue, previousRevenue, growthRate, revenueByCustomer, topCustomers);

    const avgRevenuePerCustomer = currentCount > 0 ? currentRevenue / currentCount : 0;

    return {
      total_revenue: currentRevenue,
      previous_period_revenue: previousRevenue,
      yoy_growth: this.safePercentage(currentRevenue, yoyRevenue),
      qoq_growth: this.safePercentage(currentRevenue, qoqRevenue),
      mom_growth: this.safePercentage(currentRevenue, momRevenue),
      revenue_by_region: revenueByRegion,
      revenue_by_business_unit: revenueByBusinessUnit,
      revenue_by_product: revenueByProduct,
      revenue_by_customer: revenueByCustomer,
      average_revenue_per_customer: avgRevenuePerCustomer,
      customer_count: currentCount,
      transaction_count: 0,
      top_customers: topCustomers,
      time_series: timeSeries,
      growth_rate: growthRate,
      is_sustainable: isSustainable,
      alerts: alerts,
    };
  }

  async GetExecutiveRevenueReport(organizationName: string, period: string): Promise<Record<string, unknown>> {
    const organizationID = await this.resolveOrganizationID(organizationName);
    const now = new Date();

    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousStartDate = new Date(startDate.getTime() - 86400000);
        previousEndDate = startDate;
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 86400000);
        previousStartDate = new Date(startDate.getTime() - 7 * 86400000);
        previousEndDate = startDate;
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, startDate.getDate());
        previousEndDate = startDate;
        break;
      case "quarterly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 3, startDate.getDate());
        previousEndDate = startDate;
        break;
      case "yearly":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
        previousEndDate = startDate;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, startDate.getDate());
        previousEndDate = startDate;
    }

    const currentFilter: RevenueFilter = {
      organization_name: organizationName,
      organization_id: organizationID,
      start_date: startDate,
      end_date: now,
    };

    const previousFilter: RevenueFilter = {
      organization_name: organizationName,
      organization_id: organizationID,
      start_date: previousStartDate,
      end_date: previousEndDate,
    };

    const currentMetrics = await this.CalculateRevenueKPI(currentFilter);
    let previousMetrics: RevenueMetrics;
    try {
      previousMetrics = await this.CalculateRevenueKPI(previousFilter);
    } catch {
      console.warn("Warning: failed to get previous metrics");
      previousMetrics = {
        total_revenue: 0,
        previous_period_revenue: 0,
        yoy_growth: 0,
        qoq_growth: 0,
        mom_growth: 0,
        revenue_by_region: {},
        revenue_by_business_unit: {},
        revenue_by_product: {},
        revenue_by_customer: {},
        average_revenue_per_customer: 0,
        customer_count: 0,
        transaction_count: 0,
        top_customers: [],
        time_series: [],
        growth_rate: 0,
        is_sustainable: true,
        alerts: [],
      };
    }

    const globalFilter: RevenueFilter = {
      organization_id: organizationID,
      start_date: startDate,
      end_date: now,
      organization_name: organizationName,
    };
    let globalRevenue = 0;
    try {
      [globalRevenue] = await this.calculateRevenue(globalFilter);
    } catch (err) {
      console.warn(`Warning: failed to get global revenue: ${err}`);
    }

    const usaFilter: RevenueFilter = { ...globalFilter, region: "USA" };
    let usaRevenue = 0;
    try {
      [usaRevenue] = await this.calculateRevenue(usaFilter);
    } catch { /* ignore */ }

    const europeFilter: RevenueFilter = { ...globalFilter, region: "Europe" };
    let europeRevenue = 0;
    try {
      [europeRevenue] = await this.calculateRevenue(europeFilter);
    } catch { /* ignore */ }

    const latamFilter: RevenueFilter = { ...globalFilter, region: "LATAM" };
    let latamRevenue = 0;
    try {
      [latamRevenue] = await this.calculateRevenue(latamFilter);
    } catch { /* ignore */ }

    return {
      report_type: "executive_revenue",
      period,
      date_range: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      global_revenue: globalRevenue,
      yoy_growth: currentMetrics.yoy_growth,
      revenue_by_region: {
        USA: usaRevenue,
        Europe: europeRevenue,
        LATAM: latamRevenue,
      },
      revenue_by_business_unit: currentMetrics.revenue_by_business_unit,
      growth_rate: currentMetrics.growth_rate,
      is_sustainable: currentMetrics.is_sustainable,
      top_customers: currentMetrics.top_customers,
      alerts: currentMetrics.alerts,
      time_series: currentMetrics.time_series,
      comparison: {
        previous_period_revenue: previousMetrics.total_revenue,
        growth_vs_previous: this.safePercentage(currentMetrics.total_revenue, previousMetrics.total_revenue),
      },
    };
  }

  async GetRegionalRevenueReport(organizationName: string, region: string, period: string): Promise<Record<string, unknown>> {
    const organizationID = await this.resolveOrganizationID(organizationName);
    const now = new Date();

    let startDate: Date;
    switch (period) {
      case "daily": startDate = new Date(now.getTime() - 86400000); break;
      case "weekly": startDate = new Date(now.getTime() - 7 * 86400000); break;
      case "monthly": startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case "quarterly": startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
      case "yearly": startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const filter: RevenueFilter = {
      organization_name: organizationName,
      organization_id: organizationID,
      start_date: startDate,
      end_date: now,
      region,
    };

    const metrics = await this.CalculateRevenueKPI(filter);

    const yoyFilter: RevenueFilter = {
      organization_id: organizationID,
      start_date: new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate()),
      end_date: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      region,
      organization_name: organizationName,
    };
    let yoyRevenue = 0;
    try {
      [yoyRevenue] = await this.calculateRevenue(yoyFilter);
    } catch { /* ignore */ }

    return {
      report_type: "regional_revenue",
      region,
      period,
      total_revenue: metrics.total_revenue,
      yoy_growth: this.safePercentage(metrics.total_revenue, yoyRevenue),
      customer_count: metrics.customer_count,
      avg_revenue_per_customer: metrics.average_revenue_per_customer,
      top_products: metrics.revenue_by_product,
      top_customers: metrics.top_customers,
      time_series: metrics.time_series,
      alerts: metrics.alerts,
    };
  }

  async GetBusinessUnitRevenueReport(organizationName: string, businessUnit: string, period: string): Promise<Record<string, unknown>> {
    const organizationID = await this.resolveOrganizationID(organizationName);
    const now = new Date();

    let startDate: Date;
    switch (period) {
      case "daily": startDate = new Date(now.getTime() - 86400000); break;
      case "weekly": startDate = new Date(now.getTime() - 7 * 86400000); break;
      case "monthly": startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case "quarterly": startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
      case "yearly": startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const filter: RevenueFilter = {
      organization_name: organizationName,
      organization_id: organizationID,
      start_date: startDate,
      end_date: now,
      business_unit: businessUnit,
    };

    const metrics = await this.CalculateRevenueKPI(filter);

    let allBusinessUnits: Record<string, number> = {};
    try {
      allBusinessUnits = await this.calculateRevenueByDimension(filter, "business_unit");
    } catch (err) {
      console.warn(`Warning: failed to get all business units: ${err}`);
    }

    const totalRevenue = Object.values(allBusinessUnits).reduce((sum, v) => sum + v, 0);
    const marketShare = totalRevenue > 0 ? (metrics.total_revenue / totalRevenue) * 100 : 0;

    return {
      report_type: "business_unit_revenue",
      business_unit: businessUnit,
      period,
      total_revenue: metrics.total_revenue,
      market_share: marketShare,
      growth_rate: metrics.growth_rate,
      customer_count: metrics.customer_count,
      avg_revenue_per_customer: metrics.average_revenue_per_customer,
      revenue_by_product: metrics.revenue_by_product,
      revenue_by_region: metrics.revenue_by_region,
      top_customers: metrics.top_customers,
      time_series: metrics.time_series,
      alerts: metrics.alerts,
      all_business_units: allBusinessUnits,
    };
  }

  private async calculateRevenue(filter: RevenueFilter): Promise<[number, number]> {
    let queryStr = `
      SELECT COALESCE(SUM(amount), 0) as total_revenue, COUNT(DISTINCT customer_id) as customer_count
      FROM revenue_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [filter.organization_id, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.country) {
      queryStr += ` AND country = $${paramCounter++}`;
      params.push(filter.country);
    }
    if (filter.currency) {
      queryStr += ` AND currency = $${paramCounter++}`;
      params.push(filter.currency);
    }
    if (filter.business_unit) {
      queryStr += ` AND business_unit = $${paramCounter++}`;
      params.push(filter.business_unit);
    }
    if (filter.product) {
      queryStr += ` AND product = $${paramCounter++}`;
      params.push(filter.product);
    }
    if (filter.enterprise_customer) {
      queryStr += ` AND customer_id = $${paramCounter++}`;
      params.push(filter.enterprise_customer);
    }
    if (filter.market_segment) {
      queryStr += ` AND market_segment = $${paramCounter++}`;
      params.push(filter.market_segment);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }

    const result = await query(queryStr, params);
    return [parseFloat(result.rows[0]?.total_revenue || "0"), parseInt(result.rows[0]?.customer_count || "0", 10)];
  }

  private async calculateRevenueByDimension(filter: RevenueFilter, dimension: string): Promise<Record<string, number>> {
    let dimCol: string;
    switch (dimension) {
      case "region": dimCol = "region"; break;
      case "business_unit": dimCol = "business_unit"; break;
      case "product": dimCol = "product"; break;
      default: throw new Error(`unsupported dimension: ${dimension}`);
    }

    let queryStr = `
      SELECT ${dimCol} as dimension_value, COALESCE(SUM(amount), 0) as revenue
      FROM revenue_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [filter.organization_id, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.country) {
      queryStr += ` AND country = $${paramCounter++}`;
      params.push(filter.country);
    }
    if (filter.currency) {
      queryStr += ` AND currency = $${paramCounter++}`;
      params.push(filter.currency);
    }
    if (filter.business_unit && dimension !== "business_unit") {
      queryStr += ` AND business_unit = $${paramCounter++}`;
      params.push(filter.business_unit);
    }
    if (filter.product && dimension !== "product") {
      queryStr += ` AND product = $${paramCounter++}`;
      params.push(filter.product);
    }
    if (filter.region && dimension !== "region") {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }

    queryStr += ` GROUP BY ${dimCol} ORDER BY revenue DESC`;

    const result = await query(queryStr, params);
    const map: Record<string, number> = {};
    for (const row of result.rows) {
      map[row.dimension_value] = parseFloat(row.revenue);
    }
    return map;
  }

  private async calculateRevenueByCustomer(filter: RevenueFilter): Promise<[Record<string, number>, CustomerRevenue[]]> {
    let queryStr = `
      SELECT customer_id, customer_name, COALESCE(SUM(amount), 0) as revenue
      FROM revenue_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [filter.organization_id, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.country) {
      queryStr += ` AND country = $${paramCounter++}`;
      params.push(filter.country);
    }
    if (filter.business_unit) {
      queryStr += ` AND business_unit = $${paramCounter++}`;
      params.push(filter.business_unit);
    }
    if (filter.product) {
      queryStr += ` AND product = $${paramCounter++}`;
      params.push(filter.product);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }

    queryStr += ` GROUP BY customer_id, customer_name ORDER BY revenue DESC LIMIT 10`;

    const result = await query(queryStr, params);
    const revenueByCustomer: Record<string, number> = {};
    const topCustomers: CustomerRevenue[] = [];
    let totalRevenue = 0;

    for (const row of result.rows) {
      const revenue = parseFloat(row.revenue);
      revenueByCustomer[row.customer_id] = revenue;
      totalRevenue += revenue;
      topCustomers.push({
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        revenue,
        percentage: 0,
      });
    }

    for (const c of topCustomers) {
      c.percentage = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
    }

    return [revenueByCustomer, topCustomers];
  }

  private async calculateTimeSeries(filter: RevenueFilter): Promise<TimeSeriesPoint[]> {
    let timeGroup: string;
    const period = filter.period || "daily";

    switch (period) {
      case "daily": timeGroup = "DATE(transaction_date)"; break;
      case "weekly": timeGroup = "DATE_TRUNC('week', transaction_date)"; break;
      case "monthly": timeGroup = "DATE_TRUNC('month', transaction_date)"; break;
      case "quarterly": timeGroup = "DATE_TRUNC('quarter', transaction_date)"; break;
      case "yearly": timeGroup = "DATE_TRUNC('year', transaction_date)"; break;
      default: timeGroup = "DATE(transaction_date)";
    }

    let queryStr = `
      SELECT ${timeGroup} as period, COALESCE(SUM(amount), 0) as revenue, COUNT(*) as transaction_count, MIN(transaction_date) as timestamp
      FROM revenue_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
    `;
    const params: unknown[] = [filter.organization_id, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.country) {
      queryStr += ` AND country = $${paramCounter++}`;
      params.push(filter.country);
    }
    if (filter.business_unit) {
      queryStr += ` AND business_unit = $${paramCounter++}`;
      params.push(filter.business_unit);
    }
    if (filter.product) {
      queryStr += ` AND product = $${paramCounter++}`;
      params.push(filter.product);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }

    queryStr += ` GROUP BY period ORDER BY period`;

    const result = await query(queryStr, params);

    return result.rows.map((row: Record<string, unknown>) => {
      let periodStr = "";
      if (row.period instanceof Date) {
        periodStr = (row.period as Date).toISOString().substring(0, 10);
      } else {
        periodStr = String(row.period);
      }
      return {
        period: periodStr,
        revenue: parseFloat(row.revenue as string),
        count: parseInt(row.transaction_count as string, 10),
        timestamp: row.timestamp as Date,
      };
    });
  }

  private isGrowthSustainable(growthRate: number, _revenueByCustomer: Record<string, number>, topCustomers: CustomerRevenue[]): boolean {
    if (growthRate > 100) return false;
    if (topCustomers.length > 0) {
      if (topCustomers[0].percentage > 50) return false;
      const top3Percentage = topCustomers.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0);
      if (top3Percentage > 80) return false;
    }
    return true;
  }

  private generateRevenueAlerts(currentRevenue: number, previousRevenue: number, growthRate: number, _revenueByCustomer: Record<string, number>, topCustomers: CustomerRevenue[]): RevenueAlert[] {
    const alerts: RevenueAlert[] = [];

    if (currentRevenue < previousRevenue && previousRevenue > 0) {
      const declinePercent = ((previousRevenue - currentRevenue) / previousRevenue) * 100;
      if (declinePercent > 20) {
        alerts.push({
          type: "critical",
          severity: "high",
          message: `Revenue declined by ${declinePercent.toFixed(1)}% compared to previous period`,
          value: declinePercent,
          threshold: 20,
          timestamp: new Date(),
        });
      } else if (declinePercent > 10) {
        alerts.push({
          type: "warning",
          severity: "medium",
          message: `Revenue declined by ${declinePercent.toFixed(1)}% - monitor closely`,
          value: declinePercent,
          threshold: 10,
          timestamp: new Date(),
        });
      }
    }

    if (growthRate > 0 && growthRate < 5) {
      alerts.push({
        type: "warning",
        severity: "medium",
        message: `Growth rate is slowing down to ${growthRate.toFixed(1)}%`,
        value: growthRate,
        threshold: 5,
        timestamp: new Date(),
      });
    }

    if (topCustomers.length > 0 && topCustomers[0].percentage > 40) {
      alerts.push({
        type: "warning",
        severity: "high",
        message: `Customer '${topCustomers[0].customer_name}' represents ${topCustomers[0].percentage.toFixed(1)}% of revenue - high dependency risk`,
        value: topCustomers[0].percentage,
        threshold: 40,
        timestamp: new Date(),
      });
    }

    if (growthRate > 30) {
      alerts.push({
        type: "info",
        severity: "low",
        message: `Strong revenue growth of ${growthRate.toFixed(1)}% - excellent performance!`,
        value: growthRate,
        threshold: 30,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  private safePercentage(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  }

  private async createHistoryEntry(kpiID: string, organizationID: string, version: number, _changeType: string, changedBy: string | null, changeReason: string): Promise<void> {
    const kpi = await this.GetKPIByID(kpiID, organizationID);

    const schemaJSON = JSON.stringify(kpi.calculation_schema || {});
    const permsJSON = JSON.stringify(kpi.view_permissions || {});

    await query(
      `INSERT INTO public.kpi_history (
        organization_id, kpi_id, version, name, description, target_value,
        target_min, target_max, alert_threshold, calculation_query,
        calculation_schema, depends_on, reporting_period, lookback_days,
        applicable_regions, applicable_departments, applicable_business_units,
        required_roles, view_permissions, status, changed_by, changed_at, change_reason
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP, $22
      )`,
      [
        organizationID, kpiID, version, kpi.name, kpi.description,
        kpi.target_value || null, kpi.target_min || null, kpi.target_max || null, kpi.alert_threshold || null,
        kpi.calculation_query || "", schemaJSON,
        this.stringSliceToNullStringArray(kpi.depends_on || []),
        kpi.reporting_period, kpi.lookback_days,
        this.stringSliceToNullStringArray(kpi.applicable_regions || []),
        this.stringSliceToNullStringArray(kpi.applicable_departments || []),
        this.stringSliceToNullStringArray(kpi.applicable_business_units || []),
        this.stringSliceToNullStringArray(kpi.required_roles || []),
        permsJSON, kpi.status, changedBy, changeReason,
      ]
    );
  }

  private mapRowToKPI(row: Record<string, unknown>): KPI {
    const parseJSON = (val: unknown): Record<string, unknown> => {
      if (!val) return {};
      if (typeof val === "string") { try { return JSON.parse(val); } catch { return {}; } }
      return val as Record<string, unknown>;
    };

    const parseStringArray = (val: unknown, col: string): string[] => {
      if (!val) return [];
      if (typeof val === "string") {
        const v = val as string;
        if (v === "{}") return [];
        try { return JSON.parse(v); } catch {
          return v.replace(/[{}"]/g, "").split(",").filter(Boolean);
        }
      }
      return val as string[];
    };

    return {
      id: row.id as string,
      organization_id: row.organization_id as string,
      code: row.code as string,
      name: row.name as string,
      description: (row.description as string) || "",
      category: row.category as KPICategory,
      unit: row.unit as KPIUnit,
      aggregation: row.aggregation as AggregationType,
      target_value: (row.target_value as number) ?? null,
      target_min: (row.target_min as number) ?? null,
      target_max: (row.target_max as number) ?? null,
      comparison_operator: row.comparison_operator as ComparisonOperator,
      alert_threshold: (row.alert_threshold as number) ?? null,
      alert_enabled: row.alert_enabled as boolean,
      alert_severity: (row.alert_severity as AlertSeverity) || null,
      calculation_query: (row.calculation_query as string) || undefined,
      calculation_schema: parseJSON(row.calculation_schema),
      depends_on: parseStringArray(row.depends_on, "depends_on"),
      reporting_period: row.reporting_period as ReportingPeriod,
      lookback_days: row.lookback_days as number,
      applicable_regions: parseStringArray(row.applicable_regions, "applicable_regions"),
      applicable_departments: parseStringArray(row.applicable_departments, "applicable_departments"),
      applicable_business_units: parseStringArray(row.applicable_business_units, "applicable_business_units"),
      required_roles: parseStringArray(row.required_roles, "required_roles"),
      view_permissions: parseJSON(row.view_permissions),
      status: row.status as KPIStatus,
      version: row.version as number,
      created_by: (row.created_by as string) || null,
      updated_by: (row.updated_by as string) || null,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      last_calculated_at: (row.last_calculated_at as Date) || null,
      last_value: (row.last_value as number) ?? null,
      last_variance_percentage: (row.last_variance_percentage as number) ?? null,
    };
  }

  private stringSliceToNullStringArray(slice: string[]): string {
    if (slice.length === 0) return "{}";
    const escaped = slice.map((s) => `"${s.replace(/"/g, '\\"')}"`);
    return "{" + escaped.join(",") + "}";
  }
}
