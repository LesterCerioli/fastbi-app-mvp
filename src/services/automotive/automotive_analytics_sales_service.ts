import { query } from "../db";

export type SalesChannel =
  | "dealership" | "online" | "marketplace" | "direct_sales" | "broker"
  | "auction" | "fleet" | "consignment" | "showroom" | "test_drive_center";

export type VehicleCondition =
  | "new" | "used" | "certified_pre_owned" | "demo" | "fleet"
  | "refurbished" | "classic" | "imported";

export type CustomerType =
  | "individual" | "corporate" | "fleet" | "rental" | "government"
  | "exporter" | "leasing_company" | "finance_company";

export type FinanceType =
  | "cash" | "financing" | "leasing" | "consortium" | "trade_in"
  | "partial_financing" | "manufacturer_financing" | "credit_union";

export type ReportPeriod =
  | "daily" | "weekly" | "monthly" | "quarterly" | "semester"
  | "annual" | "ytd" | "custom";

export type ReportCategory =
  | "sales_performance" | "inventory_analytics" | "financial_metrics"
  | "customer_insights" | "market_trends" | "sales_forecast"
  | "dealership_performance" | "competitive_analysis" | "product_mix"
  | "conversion_funnel";

export const AllowedSalesChannels: SalesChannel[] = [
  "dealership", "online", "marketplace", "direct_sales", "broker",
  "auction", "fleet", "consignment", "showroom", "test_drive_center",
];

export const AllowedVehicleConditions: VehicleCondition[] = [
  "new", "used", "certified_pre_owned", "demo", "fleet",
  "refurbished", "classic", "imported",
];

export const AllowedCustomerTypes: CustomerType[] = [
  "individual", "corporate", "fleet", "rental", "government",
  "exporter", "leasing_company", "finance_company",
];

export const AllowedFinanceTypes: FinanceType[] = [
  "cash", "financing", "leasing", "consortium", "trade_in",
  "partial_financing", "manufacturer_financing", "credit_union",
];

export const AllowedReportPeriods: ReportPeriod[] = [
  "daily", "weekly", "monthly", "quarterly", "semester",
  "annual", "ytd", "custom",
];

export const AllowedReportCategories: ReportCategory[] = [
  "sales_performance", "inventory_analytics", "financial_metrics",
  "customer_insights", "market_trends", "sales_forecast",
  "dealership_performance", "competitive_analysis", "product_mix",
  "conversion_funnel",
];

export const Brands = [
  "volkswagen", "chevrolet", "fiat", "ford", "toyota", "honda",
  "hyundai", "nissan", "renault", "jeep", "bmw", "mercedes",
  "audi", "volvo", "porsche", "ferrari", "lamborghini", "tesla",
  "jaguar", "land_rover", "mazda", "mitsubishi", "subaru", "kia",
  "citroen", "peugeot", "ram", "gmc", "cadillac", "lexus",
];

export const ModelsByBrand: Record<string, string[]> = {
  volkswagen: ["golf", "polo", "virtus", "taos", "t-cross", "nivus", "saveiro", "amarok"],
  chevrolet: ["onix", "tracker", "equinox", "trailblazer", "s10", "camaro", "cruze"],
  toyota: ["corolla", "hilux", "rav4", "yaris", "sw4", "camry", "prius"],
  honda: ["civic", "accord", "hr-v", "cr-v", "city", "fit"],
  bmw: ["320i", "x1", "x3", "x5", "x6", "m3", "m4", "i8", "ix"],
  mercedes: ["c180", "c300", "e300", "gla", "glc", "gle", "s500"],
  tesla: ["model_3", "model_s", "model_x", "model_y", "cybertruck"],
};

export const Regions = [
  "north", "northeast", "central_west", "southeast", "south",
  "international", "midwest", "west_coast", "east_coast",
];

export const DealershipTiers = ["premium", "standard", "budget", "luxury", "volume"];

export interface SalesFilters {
  brand?: string;
  model?: string;
  region?: string;
  sales_channel?: string;
  vehicle_condition?: string;
  finance_type?: string;
  customer_type?: string;
  segment?: string;
  channel?: string;
}

export class AutomotiveSalesAnalyticsService {
  private validateReportRequest(reportType: string, period: string): void {
    if (!reportType) throw new Error("report type is required");
    if (!period) throw new Error("report period is required");
    if (!AllowedReportPeriods.includes(period as ReportPeriod)) {
      throw new Error(`invalid period: ${period}`);
    }
  }

  private buildFilters(filters: SalesFilters | undefined, baseParams: unknown[]): { clause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params = [...baseParams];

    const filterMap: Record<string, keyof SalesFilters> = {
      brand: "brand",
      model: "model",
      region: "region",
      sales_channel: "sales_channel",
      vehicle_condition: "vehicle_condition",
      finance_type: "finance_type",
      customer_type: "customer_type",
      segment: "segment",
      channel: "channel",
    };

    for (const [col, key] of Object.entries(filterMap)) {
      const val = filters?.[key];
      if (val && typeof val === "string" && val !== "") {
        conditions.push(`AND ${col === "segment" ? "vehicle_segment" : col} = $${params.length + 1}`);
        params.push(val);
      }
    }

    return { clause: conditions.join(" "), params };
  }

  async generateSalesPerformanceReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month" | "",
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, startDate, endDate]);

    const metricsResult = await query(
      `SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(sale_price), 0) as total_revenue,
        COALESCE(AVG(sale_price), 0) as average_ticket,
        COALESCE(SUM(profit_margin), 0) as total_profit,
        COALESCE(AVG(profit_margin), 0) as average_margin,
        COUNT(DISTINCT customer_id) as unique_customers,
        SUM(CASE WHEN finance_type != 'cash' THEN 1 ELSE 0 END) as financed_sales,
        SUM(CASE WHEN trade_in_value > 0 THEN 1 ELSE 0 END) as trade_in_sales,
        COALESCE(AVG(days_to_sell), 0) as avg_days_to_sell
       FROM automotive_sales_transactions
       WHERE organization_id = $1
         AND sale_date BETWEEN $2 AND $3
         ${clause}`,
      params
    );
    const metrics = { ...metricsResult.rows[0] };

    const result: Record<string, unknown> = { ...metrics };

    if (groupBy) {
      const timeGroup = groupBy === "day" ? "DATE(sale_date)"
        : groupBy === "week" ? "DATE_TRUNC('week', sale_date)"
        : "DATE_TRUNC('month', sale_date)";

      const tsResult = await query(
        `SELECT
          ${timeGroup} as period,
          COUNT(*) as sales_count,
          COALESCE(SUM(sale_price), 0) as revenue,
          COALESCE(AVG(sale_price), 0) as avg_price,
          COALESCE(SUM(profit_margin), 0) as profit
         FROM automotive_sales_transactions
         WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
         GROUP BY ${timeGroup}
         ORDER BY period`,
        params
      );
      result["time_series"] = tsResult.rows;
    }

    const topModelsResult = await query(
      `SELECT
        brand, model,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY brand, model
       ORDER BY units_sold DESC
       LIMIT 10`,
      params
    );
    result["top_models"] = topModelsResult.rows;

    const channelResult = await query(
      `SELECT
        sales_channel,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY sales_channel
       ORDER BY units_sold DESC`,
      params
    );
    result["channel_breakdown"] = channelResult.rows;

    const regionResult = await query(
      `SELECT
        region,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY region
       ORDER BY units_sold DESC`,
      params
    );
    result["region_breakdown"] = regionResult.rows;

    return {
      report_type: "sales_performance",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      filters: filters || {},
      metrics: result,
    };
  }

  async generateInventoryReport(
    organizationID: string,
    asOfDate: Date,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, asOfDate, asOfDate]);

    const metricsResult = await query(
      `SELECT
        COUNT(*) as total_inventory,
        COALESCE(SUM(acquisition_cost), 0) as total_cost,
        COALESCE(SUM(current_market_value), 0) as total_market_value,
        COALESCE(AVG(current_market_value), 0) as avg_value,
        SUM(CASE WHEN days_in_inventory > 90 THEN 1 ELSE 0 END) as aging_inventory,
        COALESCE(AVG(days_in_inventory), 0) as avg_days_in_inventory,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_units,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_units
       FROM automotive_inventory
       WHERE organization_id = $1
         AND created_date <= $2
         AND (sold_date IS NULL OR sold_date > $3)
         ${clause}`,
      params
    );
    const metrics = { ...metricsResult.rows[0] };

    const byModelResult = await query(
      `SELECT
        brand, model,
        COUNT(*) as units,
        COALESCE(AVG(current_market_value), 0) as avg_value,
        COALESCE(AVG(days_in_inventory), 0) as avg_days
       FROM automotive_inventory
       WHERE organization_id = $1 AND created_date <= $2 AND (sold_date IS NULL OR sold_date > $3) ${clause}
       GROUP BY brand, model
       ORDER BY units DESC`,
      params
    );
    metrics["by_model"] = byModelResult.rows;

    const agingResult = await query(
      `SELECT
        CASE
          WHEN days_in_inventory <= 30 THEN '0-30 days'
          WHEN days_in_inventory <= 60 THEN '31-60 days'
          WHEN days_in_inventory <= 90 THEN '61-90 days'
          ELSE '90+ days'
        END as aging_bucket,
        COUNT(*) as units,
        COALESCE(SUM(current_market_value), 0) as total_value
       FROM automotive_inventory
       WHERE organization_id = $1 AND created_date <= $2 AND (sold_date IS NULL OR sold_date > $3) ${clause}
       GROUP BY aging_bucket
       ORDER BY aging_bucket`,
      params
    );
    metrics["aging_analysis"] = agingResult.rows;

    const turnoverResult = await query(
      `SELECT
        EXTRACT(YEAR FROM sale_date) as year,
        COUNT(*) as units_sold,
        COALESCE(AVG(days_to_sell), 0) as avg_days_to_sell
       FROM automotive_sales_transactions
       WHERE organization_id = $1
         AND sale_date >= $2 - INTERVAL '12 months'
       GROUP BY EXTRACT(YEAR FROM sale_date)
       ORDER BY year DESC`,
      [organizationID, asOfDate]
    );
    metrics["turnover_history"] = turnoverResult.rows;

    return {
      report_type: "inventory_analytics",
      as_of_date: asOfDate.toISOString(),
      filters: filters || {},
      metrics,
    };
  }

  async generateFinancialMetricsReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, startDate, endDate]);

    const metricsResult = await query(
      `SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(sale_price), 0) as gross_revenue,
        COALESCE(SUM(acquisition_cost), 0) as total_cost,
        COALESCE(SUM(profit_margin), 0) as gross_profit,
        COALESCE(AVG(profit_margin_percentage), 0) as avg_margin_percentage,
        COALESCE(SUM(commission_paid), 0) as total_commission,
        COALESCE(SUM(finance_income), 0) as finance_income,
        COALESCE(SUM(extended_warranty_revenue), 0) as warranty_revenue,
        COALESCE(SUM(accessories_revenue), 0) as accessories_revenue
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}`,
      params
    );
    const metrics: Record<string, unknown> = { ...metricsResult.rows[0] };

    const netProfit = (metrics.gross_profit as number) + (metrics.finance_income as number)
      + (metrics.warranty_revenue as number) + (metrics.accessories_revenue as number)
      - (metrics.total_commission as number);
    metrics["net_profit"] = netProfit;
    metrics["net_margin_percentage"] = (metrics.gross_revenue as number) > 0
      ? (netProfit / (metrics.gross_revenue as number)) * 100
      : 0;

    const brandResult = await query(
      `SELECT
        brand,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(SUM(profit_margin), 0) as gross_profit,
        COALESCE(AVG(profit_margin_percentage), 0) as margin_percentage
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY brand
       ORDER BY gross_profit DESC`,
      params
    );
    metrics["profitability_by_brand"] = brandResult.rows;

    const financeResult = await query(
      `SELECT
        finance_type,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price,
        COALESCE(SUM(finance_income), 0) as finance_income
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY finance_type
       ORDER BY units_sold DESC`,
      params
    );
    metrics["finance_breakdown"] = financeResult.rows;

    return {
      report_type: "financial_metrics",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      filters: filters || {},
      metrics,
    };
  }

  async generateCustomerInsightsReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, startDate, endDate]);

    const metricsResult = await query(
      `SELECT
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(*) as total_transactions,
        COUNT(DISTINCT CASE WHEN first_purchase_date >= $2 THEN customer_id END) as new_customers,
        COALESCE(AVG(total_spent), 0) as avg_customer_value,
        SUM(CASE WHEN repeat_purchase = true THEN 1 ELSE 0 END) as repeat_customers
       FROM automotive_customer_metrics
       WHERE organization_id = $1
         AND last_purchase_date BETWEEN $2 AND $3
         ${clause}`,
      params
    );
    const metrics: Record<string, unknown> = { ...metricsResult.rows[0] };

    const totalCustomers = metrics.total_customers as number;
    if (totalCustomers > 0) {
      metrics["repeat_purchase_rate"] = ((metrics.repeat_customers as number) / totalCustomers) * 100;
      metrics["new_customer_rate"] = ((metrics.new_customers as number) / totalCustomers) * 100;
    } else {
      metrics["repeat_purchase_rate"] = 0;
      metrics["new_customer_rate"] = 0;
    }

    const segmentResult = await query(
      `SELECT
        CASE
          WHEN total_spent >= 500000 THEN 'premium'
          WHEN total_spent >= 200000 THEN 'high_value'
          WHEN total_spent >= 100000 THEN 'medium_value'
          WHEN total_spent >= 50000 THEN 'low_value'
          ELSE 'prospect'
        END as segment,
        COUNT(*) as customers,
        COALESCE(AVG(total_spent), 0) as avg_spend,
        COALESCE(AVG(purchase_frequency), 0) as avg_frequency
       FROM automotive_customer_metrics
       WHERE organization_id = $1 AND last_purchase_date BETWEEN $2 AND $3 ${clause}
       GROUP BY segment
       ORDER BY avg_spend DESC`,
      params
    );
    metrics["segments"] = segmentResult.rows;

    const prefResult = await query(
      `SELECT
        customer_type, brand, model,
        COUNT(*) as units_sold
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY customer_type, brand, model
       ORDER BY units_sold DESC
       LIMIT 20`,
      params
    );
    metrics["model_preferences"] = prefResult.rows;

    return {
      report_type: "customer_insights",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      filters: filters || {},
      metrics,
    };
  }

  async generateMarketTrendsReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, startDate, endDate]);

    const shareResult = await query(
      `SELECT
        brand,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as total_revenue,
        COALESCE(AVG(sale_price), 0) as avg_price,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as market_share_percentage
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY brand
       ORDER BY units_sold DESC`,
      params
    );

    const trendResult = await query(
      `SELECT
        DATE_TRUNC('month', sale_date) as month,
        brand,
        COALESCE(AVG(sale_price), 0) as avg_price,
        COUNT(*) as units_sold
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY month, brand
       ORDER BY month`,
      params
    );

    const segmentResult = await query(
      `SELECT
        vehicle_segment,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price,
        COALESCE(AVG(profit_margin_percentage), 0) as avg_margin
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY vehicle_segment
       ORDER BY units_sold DESC`,
      params
    );

    const configResult = await query(
      `SELECT
        brand, model, engine_type, transmission,
        COUNT(*) as units_sold,
        COALESCE(AVG(sale_price), 0) as avg_price
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY brand, model, engine_type, transmission
       ORDER BY units_sold DESC
       LIMIT 15`,
      params
    );

    return {
      report_type: "market_trends",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      filters: filters || {},
      metrics: {
        market_share_by_brand: shareResult.rows,
        price_trends: trendResult.rows,
        segment_performance: segmentResult.rows,
        top_configurations: configResult.rows,
      },
    };
  }

  async generateSalesForecastReport(
    organizationID: string,
    forecastPeriod: "1m" | "3m" | "6m" | "12m",
    historicalDataMonths: number,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, historicalDataMonths]);

    const historicalResult = await query(
      `SELECT
        DATE_TRUNC('month', sale_date) as month,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as total_revenue
       FROM automotive_sales_transactions
       WHERE organization_id = $1
         AND sale_date >= CURRENT_DATE - INTERVAL '${historicalDataMonths} months'
         ${clause}
       GROUP BY month
       ORDER BY month`,
      params
    );

    const historical = historicalResult.rows;

    const forecastMonthsMap: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6, "12m": 12 };
    const forecastMonths = forecastMonthsMap[forecastPeriod] || 3;

    let avgUnits = 0;
    let avgRevenue = 0;
    if (historical.length >= 3) {
      const last3 = historical.slice(-3);
      avgUnits = last3.reduce((s: number, r: any) => s + r.units_sold, 0) / 3;
      avgRevenue = last3.reduce((s: number, r: any) => s + r.total_revenue, 0) / 3;
    } else if (historical.length > 0) {
      const last = historical[historical.length - 1];
      avgUnits = last.units_sold;
      avgRevenue = last.total_revenue;
    }

    const forecast = [];
    const now = new Date();
    for (let i = 1; i <= forecastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecast.push({
        period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        forecasted_units: Math.round(avgUnits),
        forecasted_revenue: avgRevenue,
        confidence_lower: Math.round(avgUnits * 0.8),
        confidence_upper: Math.round(avgUnits * 1.2),
      });
    }

    let growthRate = 0;
    if (historical.length >= 6) {
      const recent3 = historical.slice(-3);
      const older3 = historical.slice(0, 3);
      const recentAvg = recent3.reduce((s: number, r: any) => s + r.units_sold, 0) / 3;
      const olderAvg = older3.reduce((s: number, r: any) => s + r.units_sold, 0) / 3;
      if (olderAvg > 0) growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;
    }

    return {
      report_type: "sales_forecast",
      forecast_period: forecastPeriod,
      historical_data_months: historicalDataMonths,
      filters: filters || {},
      metrics: {
        historical_data: historical,
        forecast,
        trend_analysis: {
          growth_rate_percentage: growthRate,
          seasonality_detected: historical.length >= 12,
          average_monthly_units: Math.round(avgUnits),
          average_monthly_revenue: avgRevenue,
        },
      },
    };
  }

  async generateDealershipPerformanceReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    dealershipIDs: string[],
  ): Promise<Record<string, unknown>> {
    const params: unknown[] = [organizationID, startDate, endDate];
    let dealerFilter = "";

    if (dealershipIDs.length > 0) {
      const placeholders = dealershipIDs.map((_, i) => `$${params.length + 1 + i}`);
      dealerFilter = `AND dealership_id IN (${placeholders.join(",")})`;
      params.push(...dealershipIDs);
    }

    const result = await query(
      `SELECT
        dealership_id,
        dealership_name,
        region,
        tier,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as total_revenue,
        COALESCE(AVG(sale_price), 0) as avg_ticket,
        COALESCE(SUM(profit_margin), 0) as total_profit,
        COALESCE(AVG(profit_margin_percentage), 0) as avg_margin,
        COUNT(DISTINCT customer_id) as unique_customers,
        COALESCE(AVG(customer_satisfaction_score), 0) as avg_csat
       FROM automotive_sales_transactions
       WHERE organization_id = $1
         AND sale_date BETWEEN $2 AND $3
         ${dealerFilter}
       GROUP BY dealership_id, dealership_name, region, tier
       ORDER BY total_revenue DESC`,
      params
    );

    const dealerships = result.rows.map((row: any, idx: number) => ({
      ...row,
      rank_by_units: idx + 1,
      rank_by_revenue: idx + 1,
      rank_by_profit: idx + 1,
    }));

    if (dealerships.length > 0) {
      const totalUnits = dealerships.reduce((s: number, d: any) => s + d.units_sold, 0);
      const totalRevenueSum = dealerships.reduce((s: number, d: any) => s + d.total_revenue, 0);
      const totalMarginSum = dealerships.reduce((s: number, d: any) => s + d.avg_margin, 0);
      const avgUnits = totalUnits / dealerships.length;
      const avgRevenue = totalRevenueSum / dealerships.length;
      const avgMargin = totalMarginSum / dealerships.length;

      for (const d of dealerships) {
        d.vs_avg_units = avgUnits > 0 ? ((d.units_sold - avgUnits) / avgUnits) * 100 : 0;
        d.vs_avg_revenue = avgRevenue > 0 ? ((d.total_revenue - avgRevenue) / avgRevenue) * 100 : 0;
        d.vs_avg_margin = d.avg_margin - avgMargin;
      }
    }

    const summary = {
      total_dealerships: dealerships.length,
      total_units_sold: dealerships.reduce((s: number, d: any) => s + d.units_sold, 0),
      total_revenue: dealerships.reduce((s: number, d: any) => s + d.total_revenue, 0),
      average_margin_percentage: dealerships.length > 0
        ? dealerships.reduce((s: number, d: any) => s + d.avg_margin, 0) / dealerships.length
        : 0,
    };

    return {
      report_type: "dealership_performance",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      metrics: { dealerships, summary },
    };
  }

  async generateProductMixReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, startDate, endDate]);

    const segmentResult = await query(
      `SELECT
        vehicle_segment,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as segment_mix_percentage
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY vehicle_segment
       ORDER BY units_sold DESC`,
      params
    );

    const modelResult = await query(
      `SELECT
        brand, model, vehicle_segment,
        COUNT(*) as units_sold,
        COALESCE(SUM(sale_price), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price,
        COALESCE(AVG(profit_margin_percentage), 0) as margin
       FROM automotive_sales_transactions
       WHERE organization_id = $1 AND sale_date BETWEEN $2 AND $3 ${clause}
       GROUP BY brand, model, vehicle_segment
       ORDER BY units_sold DESC
       LIMIT 30`,
      params
    );

    let growthQuery = `
      WITH segment_sales AS (
        SELECT
          vehicle_segment,
          DATE_TRUNC('month', sale_date) as month,
          COUNT(*) as units_sold
        FROM automotive_sales_transactions
        WHERE organization_id = $1
          AND sale_date >= $2 - INTERVAL '6 months'
          AND sale_date <= $3
          ${clause}
        GROUP BY vehicle_segment, month
      )
      SELECT
        vehicle_segment,
        COALESCE(AVG(CASE WHEN month >= $3 - INTERVAL '3 months' THEN units_sold END), 0) as recent_avg,
        COALESCE(AVG(CASE WHEN month < $3 - INTERVAL '3 months' THEN units_sold END), 0) as prior_avg,
        CASE
          WHEN COALESCE(AVG(CASE WHEN month < $3 - INTERVAL '3 months' THEN units_sold END), 0) > 0
          THEN (COALESCE(AVG(CASE WHEN month >= $3 - INTERVAL '3 months' THEN units_sold END), 0) -
                COALESCE(AVG(CASE WHEN month < $3 - INTERVAL '3 months' THEN units_sold END), 0)) /
                COALESCE(AVG(CASE WHEN month < $3 - INTERVAL '3 months' THEN units_sold END), 1) * 100
          ELSE 0
        END as growth_rate
      FROM segment_sales
      GROUP BY vehicle_segment
    `;
    const growthParams = [organizationID, startDate, endDate];

    const growthResult = await query(growthQuery, growthParams);

    return {
      report_type: "product_mix",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      filters: filters || {},
      metrics: {
        segment_mix: segmentResult.rows,
        top_models: modelResult.rows,
        segment_growth: growthResult.rows,
      },
    };
  }

  async generateConversionFunnelReport(
    organizationID: string,
    startDate: Date,
    endDate: Date,
    filters?: SalesFilters,
  ): Promise<Record<string, unknown>> {
    const { clause, params } = this.buildFilters(filters, [organizationID, startDate, endDate]);

    const result = await query(
      `SELECT
        funnel_stage,
        COUNT(DISTINCT lead_id) as leads,
        COUNT(DISTINCT CASE WHEN stage_completed = true THEN lead_id END) as completed
       FROM automotive_sales_funnel
       WHERE organization_id = $1
         AND stage_date BETWEEN $2 AND $3
         ${clause}
       GROUP BY funnel_stage
       ORDER BY
         CASE funnel_stage
           WHEN 'visit' THEN 1
           WHEN 'test_drive' THEN 2
           WHEN 'quote' THEN 3
           WHEN 'negotiation' THEN 4
           WHEN 'financing' THEN 5
           WHEN 'closing' THEN 6
         END`,
      params
    );

    const funnelStages: Record<string, unknown>[] = result.rows.map((row: any, i: number, arr: any[]) => {
      const stage: Record<string, unknown> = { ...row };
      if (i === 0) {
        stage["conversion_rate"] = 100;
      } else {
        const prevLeads = arr[i - 1].leads as number;
        stage["conversion_rate"] = prevLeads > 0 ? ((row.completed as number) / prevLeads) * 100 : 0;
      }
      stage["drop_off_rate"] = 100 - (stage["conversion_rate"] as number);
      return stage;
    });

    const totalLeads = funnelStages.length > 0 ? (funnelStages[0].leads as number) : 0;
    const totalConversions = funnelStages.length > 0 ? (funnelStages[funnelStages.length - 1].completed as number) : 0;
    const overallConversion = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

    return {
      report_type: "conversion_funnel",
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      filters: filters || {},
      metrics: {
        funnel_stages: funnelStages,
        overall_conversion_rate: overallConversion,
        total_leads: totalLeads,
        total_conversions: totalConversions,
      },
    };
  }

  async generateExecutiveDashboard(
    organizationID: string,
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
  ): Promise<Record<string, unknown>> {
    const now = new Date();
    let startDate: Date, compareStart: Date, compareEnd: Date;

    switch (period) {
      case "daily":
        startDate = new Date(now.getTime() - 86400000);
        compareStart = new Date(now.getTime() - 2 * 86400000);
        compareEnd = new Date(now.getTime() - 86400000);
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 86400000);
        compareStart = new Date(now.getTime() - 14 * 86400000);
        compareEnd = new Date(now.getTime() - 7 * 86400000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        compareStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        compareEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "quarterly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        compareStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        compareEnd = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        compareStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        compareEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const currentReport = await this.generateSalesPerformanceReport(organizationID, startDate, now, "", undefined);
    const compareReport = await this.generateSalesPerformanceReport(organizationID, compareStart, compareEnd, "", undefined);
    const inventoryReport = await this.generateInventoryReport(organizationID, now, undefined);
    const financialReport = await this.generateFinancialMetricsReport(organizationID, startDate, now, undefined);
    const customerReport = await this.generateCustomerInsightsReport(organizationID, startDate, now, undefined);

    const currentMetrics = currentReport.metrics as Record<string, unknown>;
    const compareMetrics = compareReport.metrics as Record<string, unknown>;

    const calcVariance = (cur: unknown, prev: unknown): number => {
      const c = typeof cur === "number" ? cur : 0;
      const p = typeof prev === "number" ? prev : 0;
      return p > 0 ? ((c - p) / p) * 100 : 0;
    };

    const keyMetrics = {
      sales: {
        current: currentMetrics.total_sales,
        previous: compareMetrics.total_sales,
        variance_percentage: calcVariance(currentMetrics.total_sales, compareMetrics.total_sales),
      },
      revenue: {
        current: currentMetrics.total_revenue,
        previous: compareMetrics.total_revenue,
        variance_percentage: calcVariance(currentMetrics.total_revenue, compareMetrics.total_revenue),
      },
      average_ticket: {
        current: currentMetrics.average_ticket,
        previous: compareMetrics.average_ticket,
        variance_percentage: calcVariance(currentMetrics.average_ticket, compareMetrics.average_ticket),
      },
      inventory_value: (inventoryReport.metrics as Record<string, unknown>).total_market_value,
      gross_profit: (financialReport.metrics as Record<string, unknown>).gross_profit,
      unique_customers: (customerReport.metrics as Record<string, unknown>).total_customers,
    };

    const alerts = this.generateAlerts(currentMetrics, compareMetrics);

    return {
      dashboard_type: "executive_summary",
      period,
      date_range: {
        current: { start: startDate.toISOString(), end: now.toISOString() },
        comparison: { start: compareStart.toISOString(), end: compareEnd.toISOString() },
      },
      key_metrics: keyMetrics,
      top_performers: {
        top_models: currentMetrics.top_models,
        top_channels: currentMetrics.channel_breakdown,
      },
      alerts,
    };
  }

  private generateAlerts(current: Record<string, unknown>, previous: Record<string, unknown>): Record<string, unknown>[] {
    const alerts: Record<string, unknown>[] = [];
    const currentSales = current.total_sales as number;
    const previousSales = previous.total_sales as number;

    if (previousSales > 0) {
      const variance = ((currentSales - previousSales) / previousSales) * 100;
      if (variance < -20) {
        alerts.push({
          type: "warning",
          severity: "high",
          message: `Sales volume decreased by ${(-variance).toFixed(1)}% compared to previous period`,
        });
      } else if (variance > 20) {
        alerts.push({
          type: "success",
          severity: "medium",
          message: `Sales volume increased by ${variance.toFixed(1)}% - excellent performance!`,
        });
      }
    }

    const avgDays = current.avg_days_to_sell as number;
    if (avgDays > 90) {
      alerts.push({
        type: "warning",
        severity: "high",
        message: `Average days to sell is ${avgDays.toFixed(0)} days - above target of 90 days`,
      });
    }

    return alerts;
  }

  async exportReport(reportData: Record<string, unknown>, format: "json" | "csv"): Promise<Record<string, unknown>> {
    if (format === "json") {
      return {
        export_format: "json",
        data: reportData,
        filename: `automotive_sales_report_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.json`,
      };
    }

    if (format === "csv") {
      const rows: string[][] = [["Report Type", "Period", "Metric", "Value"]];
      const reportType = reportData.report_type as string;
      const periodStr = JSON.stringify(reportData.period);
      const metrics = reportData.metrics as Record<string, unknown>;

      const flatten = (prefix: string, m: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(m)) {
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (typeof v === "object" && !Array.isArray(v)) {
            flatten(fullKey, v as Record<string, unknown>);
          } else if (Array.isArray(v)) {
            v.forEach((item, i) => {
              rows.push([reportType, periodStr, `${fullKey}[${i}]`, String(item)]);
            });
          } else {
            rows.push([reportType, periodStr, fullKey, String(v)]);
          }
        }
      };
      flatten("", metrics);

      const csvContent = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      return {
        export_format: "csv",
        data: csvContent,
        filename: `automotive_sales_report_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv`,
      };
    }

    throw new Error(`unsupported export format: ${format}`);
  }
}
