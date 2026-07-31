import { query } from "../db";

export interface GrossMarginFilter {
  organization_name: string;
  start_date: Date;
  end_date: Date;
  period_type: string;
  margin_type: string;
  product_category?: string | null;
  product_id?: string | null;
  customer_tier?: string | null;
  region?: string | null;
  state?: string | null;
  channel?: string | null;
}

export interface GrossMarginCostBreakdown {
  direct_materials: number;
  direct_labor: number;
  manufacturing: number;
  freight_in: number;
  royalties: number;
  commission: number;
  shipping: number;
  payment_fees: number;
  packaging: number;
  fixed_direct_allocated: number;
}

export interface ProductMarginItem {
  product_id: string;
  product_name: string;
  product_category: string;
  revenue: number;
  cost: number;
  margin_percent: number;
  revenue_percent: number;
}

export interface CustomerTierMarginItem {
  customer_tier: string;
  revenue: number;
  cost: number;
  margin_percent: number;
  customer_count: number;
}

export interface RegionMarginItem {
  region: string;
  revenue: number;
  cost: number;
  margin_percent: number;
}

export interface ChannelMarginItem {
  channel: string;
  revenue: number;
  cost: number;
  margin_percent: number;
}

export interface GrossMarginMetrics {
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_percent: number;
  cost_breakdown: GrossMarginCostBreakdown;
  previous_period_margin: number;
  margin_change_points: number;
  yoy_previous_margin: number;
  yoy_margin_change_points: number;
  by_product?: ProductMarginItem[];
  by_customer_tier?: CustomerTierMarginItem[];
  by_region?: RegionMarginItem[];
  by_channel?: ChannelMarginItem[];
  calculated_at: Date;
}

export interface SeasonalityPoint {
  month: number;
  factor: number;
  typical_margin: number;
}

export interface HistoricalMarginPoint {
  year: number;
  month: number;
  date: Date;
  revenue: number;
  cost: number;
  margin: number;
}

export interface TrendResult {
  slope: number;
  intercept: number;
  r2: number;
}

export interface MarginForecast {
  next_month: number;
  next_quarter: number;
  next_year: number;
  confidence_lower: number;
  confidence_upper: number;
  seasonality_detected: boolean;
  seasonality_pattern?: SeasonalityPoint[];
  trend_direction: string;
  rmse: number;
  historical_periods: number;
  methodology: string;
}

export class GrossMarginService {
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

  async CalculateGrossMargin(filter: GrossMarginFilter): Promise<GrossMarginMetrics> {
    if (!filter.organization_name) {
      throw new Error("organization_name is required");
    }
    if (!filter.start_date || !filter.end_date) {
      throw new Error("start_date and end_date are required");
    }

    const organizationID = await this.resolveOrganizationID(filter.organization_name);

    const [currentRevenue, currentCost, costBreakdown] = await this.calculateCurrentPeriodMetrics(organizationID, filter);

    let previousMargin = 0;
    try {
      previousMargin = await this.calculatePreviousPeriodMargin(organizationID, filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate previous period margin: ${err}`);
    }

    let yoyPreviousMargin = 0;
    try {
      yoyPreviousMargin = await this.calculateYoYPreviousMargin(organizationID, filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate YoY margin: ${err}`);
    }

    const currentMarginPercent = currentRevenue > 0 ? ((currentRevenue - currentCost) / currentRevenue) * 100 : 0;
    const marginChangePoints = currentMarginPercent - previousMargin;
    const yoyMarginChangePoints = currentMarginPercent - yoyPreviousMargin;

    const metrics: GrossMarginMetrics = {
      period_start: this.formatDate(filter.start_date),
      period_end: this.formatDate(filter.end_date),
      total_revenue: currentRevenue,
      total_cost: currentCost,
      gross_profit: currentRevenue - currentCost,
      gross_margin_percent: currentMarginPercent,
      cost_breakdown: costBreakdown,
      previous_period_margin: previousMargin,
      margin_change_points: marginChangePoints,
      yoy_previous_margin: yoyPreviousMargin,
      yoy_margin_change_points: yoyMarginChangePoints,
      calculated_at: new Date(),
    };

    try {
      metrics.by_product = await this.calculateMarginsByProduct(organizationID, filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate margins by product: ${err}`);
    }

    try {
      metrics.by_customer_tier = await this.calculateMarginsByCustomerTier(organizationID, filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate margins by customer tier: ${err}`);
    }

    try {
      metrics.by_region = await this.calculateMarginsByRegion(organizationID, filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate margins by region: ${err}`);
    }

    try {
      metrics.by_channel = await this.calculateMarginsByChannel(organizationID, filter);
    } catch (err) {
      console.warn(`Warning: failed to calculate margins by channel: ${err}`);
    }

    return metrics;
  }

  async CalculateMarginForecast(filter: GrossMarginFilter, _monthsToProject?: number): Promise<MarginForecast> {
    const err = this.validateForecastFilter(filter);
    if (err) throw err;

    const organizationID = await this.resolveOrganizationID(filter.organization_name);

    const historicalData = await this.getHistoricalMonthlyMargins(organizationID, filter, 24);

    if (historicalData.length < 12) {
      throw new Error("insufficient historical data for forecast (need at least 12 months)");
    }

    const [seasonality, hasSeasonality] = this.detectSeasonality(historicalData);
    const trend = this.calculateLinearTrend(historicalData);
    if (!trend) throw new Error("need at least 2 data points for trend calculation");

    const lastValue = historicalData[historicalData.length - 1].margin;

    const forecast: MarginForecast = {
      seasonality_detected: hasSeasonality,
      seasonality_pattern: seasonality,
      trend_direction: this.getTrendDirection(trend),
      methodology: "linear_regression_with_seasonality",
      historical_periods: historicalData.length,
      next_month: this.projectNextMonth(lastValue, trend, seasonality, 1),
      next_quarter: this.projectNextQuarter(lastValue, trend, seasonality),
      next_year: this.projectNextYear(lastValue, trend, seasonality),
      confidence_lower: 0,
      confidence_upper: 0,
      rmse: 0,
    };

    const [confidenceLower, confidenceUpper] = this.calculateConfidenceInterval(historicalData);
    forecast.confidence_lower = confidenceLower;
    forecast.confidence_upper = confidenceUpper;
    forecast.rmse = this.calculateRMSE(historicalData, trend, seasonality);

    return forecast;
  }

  private async calculateCurrentPeriodMetrics(organizationID: string, filter: GrossMarginFilter): Promise<[number, number, GrossMarginCostBreakdown]> {
    const breakdown: GrossMarginCostBreakdown = {
      direct_materials: 0,
      direct_labor: 0,
      manufacturing: 0,
      freight_in: 0,
      royalties: 0,
      commission: 0,
      shipping: 0,
      payment_fees: 0,
      packaging: 0,
      fixed_direct_allocated: 0,
    };

    let queryStr = `
      SELECT COALESCE(SUM(amount_usd), 0) as total_revenue,
             COALESCE(SUM(total_cogs), 0) as total_cost,
             COALESCE(SUM(cogs_direct_material), 0) as total_direct_material,
             COALESCE(SUM(cogs_direct_labor), 0) as total_direct_labor,
             COALESCE(SUM(cogs_manufacturing), 0) as total_manufacturing,
             COALESCE(SUM(cogs_freight_in), 0) as total_freight_in,
             COALESCE(SUM(cogs_royalties), 0) as total_royalties,
             COALESCE(SUM(variable_commission), 0) as total_commission,
             COALESCE(SUM(variable_shipping), 0) as total_shipping,
             COALESCE(SUM(variable_payment_fees), 0) as total_payment_fees,
             COALESCE(SUM(variable_packaging), 0) as total_packaging,
             COALESCE(SUM(fixed_direct_allocated), 0) as total_fixed_allocated
      FROM public.financial_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
        AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.product_category) {
      queryStr += ` AND product_category = $${paramCounter++}`;
      params.push(filter.product_category);
    }
    if (filter.product_id) {
      queryStr += ` AND product_id = $${paramCounter++}`;
      params.push(filter.product_id);
    }
    if (filter.customer_tier) {
      queryStr += ` AND customer_tier = $${paramCounter++}`;
      params.push(filter.customer_tier);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }
    if (filter.state) {
      queryStr += ` AND state = $${paramCounter++}`;
      params.push(filter.state);
    }
    if (filter.channel) {
      queryStr += ` AND channel = $${paramCounter++}`;
      params.push(filter.channel);
    }

    const result = await query(queryStr, params);

    if (result.rows[0]) {
      const row = result.rows[0];
      breakdown.direct_materials = parseFloat(row.total_direct_material);
      breakdown.direct_labor = parseFloat(row.total_direct_labor);
      breakdown.manufacturing = parseFloat(row.total_manufacturing);
      breakdown.freight_in = parseFloat(row.total_freight_in);
      breakdown.royalties = parseFloat(row.total_royalties);
      breakdown.commission = parseFloat(row.total_commission);
      breakdown.shipping = parseFloat(row.total_shipping);
      breakdown.payment_fees = parseFloat(row.total_payment_fees);
      breakdown.packaging = parseFloat(row.total_packaging);
      breakdown.fixed_direct_allocated = parseFloat(row.total_fixed_allocated);

      return [parseFloat(row.total_revenue), parseFloat(row.total_cost), breakdown];
    }

    return [0, 0, breakdown];
  }

  private async calculatePreviousPeriodMargin(organizationID: string, filter: GrossMarginFilter): Promise<number> {
    const duration = filter.end_date.getTime() - filter.start_date.getTime();
    const previousStart = new Date(filter.start_date.getTime() - duration);
    const previousEnd = filter.start_date;

    let queryStr = `
      SELECT COALESCE(SUM(amount_usd), 0) as total_revenue,
             COALESCE(SUM(total_cogs), 0) as total_cost
      FROM public.financial_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
        AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, previousStart, previousEnd];
    let paramCounter = 4;

    if (filter.product_category) {
      queryStr += ` AND product_category = $${paramCounter++}`;
      params.push(filter.product_category);
    }
    if (filter.product_id) {
      queryStr += ` AND product_id = $${paramCounter++}`;
      params.push(filter.product_id);
    }
    if (filter.customer_tier) {
      queryStr += ` AND customer_tier = $${paramCounter++}`;
      params.push(filter.customer_tier);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }
    if (filter.channel) {
      queryStr += ` AND channel = $${paramCounter++}`;
      params.push(filter.channel);
    }

    const result = await query(queryStr, params);
    const revenue = parseFloat(result.rows[0]?.total_revenue || "0");
    const cost = parseFloat(result.rows[0]?.total_cost || "0");

    return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  }

  private async calculateYoYPreviousMargin(organizationID: string, filter: GrossMarginFilter): Promise<number> {
    const yoyStart = new Date(filter.start_date.getFullYear() - 1, filter.start_date.getMonth(), filter.start_date.getDate());
    const yoyEnd = new Date(filter.end_date.getFullYear() - 1, filter.end_date.getMonth(), filter.end_date.getDate());

    let queryStr = `
      SELECT COALESCE(SUM(amount_usd), 0) as total_revenue,
             COALESCE(SUM(total_cogs), 0) as total_cost
      FROM public.financial_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
        AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, yoyStart, yoyEnd];
    let paramCounter = 4;

    if (filter.product_category) {
      queryStr += ` AND product_category = $${paramCounter++}`;
      params.push(filter.product_category);
    }
    if (filter.product_id) {
      queryStr += ` AND product_id = $${paramCounter++}`;
      params.push(filter.product_id);
    }
    if (filter.customer_tier) {
      queryStr += ` AND customer_tier = $${paramCounter++}`;
      params.push(filter.customer_tier);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }
    if (filter.channel) {
      queryStr += ` AND channel = $${paramCounter++}`;
      params.push(filter.channel);
    }

    const result = await query(queryStr, params);
    const revenue = parseFloat(result.rows[0]?.total_revenue || "0");
    const cost = parseFloat(result.rows[0]?.total_cost || "0");

    return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  }

  private async calculateMarginsByProduct(organizationID: string, filter: GrossMarginFilter): Promise<ProductMarginItem[]> {
    const revenueResult = await query(
      `SELECT COALESCE(SUM(amount_usd), 0) as total
       FROM public.financial_transactions
       WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
         AND transaction_type IN ('sale', 'subscription')`,
      [organizationID, filter.start_date, filter.end_date]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0]?.total || "0");

    let queryStr = `
      SELECT COALESCE(product_id, '00000000-0000-0000-0000-000000000000') as product_id,
             COALESCE(product_name, 'Uncategorized') as product_name,
             COALESCE(product_category, 'Uncategorized') as product_category,
             COALESCE(SUM(amount_usd), 0) as revenue,
             COALESCE(SUM(total_cogs), 0) as cost
      FROM public.financial_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
        AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }
    if (filter.channel) {
      queryStr += ` AND channel = $${paramCounter++}`;
      params.push(filter.channel);
    }

    queryStr += ` GROUP BY product_id, product_name, product_category ORDER BY revenue DESC LIMIT 50`;

    const result = await query(queryStr, params);

    return result.rows.map((row: Record<string, unknown>) => {
      const revenue = parseFloat(row.revenue as string);
      const cost = parseFloat(row.cost as string);
      const marginPercent = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
      const revenuePercent = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

      return {
        product_id: row.product_id as string,
        product_name: row.product_name as string,
        product_category: row.product_category as string,
        revenue,
        cost,
        margin_percent: marginPercent,
        revenue_percent: revenuePercent,
      };
    });
  }

  private async calculateMarginsByCustomerTier(organizationID: string, filter: GrossMarginFilter): Promise<CustomerTierMarginItem[]> {
    let queryStr = `
      WITH customer_tier_data AS (
        SELECT COALESCE(customer_tier, 'uncategorized') as tier,
               COUNT(DISTINCT customer_id) as customer_count,
               COALESCE(SUM(amount_usd), 0) as revenue,
               COALESCE(SUM(total_cogs), 0) as cost
        FROM public.financial_transactions
        WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
          AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.product_category) {
      queryStr += ` AND product_category = $${paramCounter++}`;
      params.push(filter.product_category);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }

    queryStr += `
        GROUP BY customer_tier
      )
      SELECT tier, revenue, cost, customer_count,
             CASE WHEN revenue > 0 THEN ((revenue - cost) / revenue) * 100 ELSE 0 END as margin_percent
      FROM customer_tier_data
      ORDER BY revenue DESC
    `;

    const result = await query(queryStr, params);

    return result.rows.map((row: Record<string, unknown>) => ({
      customer_tier: row.tier as string,
      revenue: parseFloat(row.revenue as string),
      cost: parseFloat(row.cost as string),
      margin_percent: parseFloat(row.margin_percent as string),
      customer_count: parseInt(row.customer_count as string, 10),
    }));
  }

  private async calculateMarginsByRegion(organizationID: string, filter: GrossMarginFilter): Promise<RegionMarginItem[]> {
    let queryStr = `
      SELECT COALESCE(region, 'unknown') as region,
             COALESCE(SUM(amount_usd), 0) as revenue,
             COALESCE(SUM(total_cogs), 0) as cost,
             CASE WHEN SUM(amount_usd) > 0
               THEN ((SUM(amount_usd) - SUM(total_cogs)) / SUM(amount_usd)) * 100
               ELSE 0
             END as margin_percent
      FROM public.financial_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
        AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.product_category) {
      queryStr += ` AND product_category = $${paramCounter++}`;
      params.push(filter.product_category);
    }
    if (filter.channel) {
      queryStr += ` AND channel = $${paramCounter++}`;
      params.push(filter.channel);
    }

    queryStr += ` GROUP BY region ORDER BY revenue DESC`;

    const result = await query(queryStr, params);

    return result.rows.map((row: Record<string, unknown>) => ({
      region: row.region as string,
      revenue: parseFloat(row.revenue as string),
      cost: parseFloat(row.cost as string),
      margin_percent: parseFloat(row.margin_percent as string),
    }));
  }

  private async calculateMarginsByChannel(organizationID: string, filter: GrossMarginFilter): Promise<ChannelMarginItem[]> {
    let queryStr = `
      SELECT COALESCE(channel, 'unknown') as channel,
             COALESCE(SUM(amount_usd), 0) as revenue,
             COALESCE(SUM(total_cogs), 0) as cost,
             CASE WHEN SUM(amount_usd) > 0
               THEN ((SUM(amount_usd) - SUM(total_cogs)) / SUM(amount_usd)) * 100
               ELSE 0
             END as margin_percent
      FROM public.financial_transactions
      WHERE organization_id = $1 AND transaction_date BETWEEN $2 AND $3
        AND transaction_type IN ('sale', 'subscription')
    `;
    const params: unknown[] = [organizationID, filter.start_date, filter.end_date];
    let paramCounter = 4;

    if (filter.product_category) {
      queryStr += ` AND product_category = $${paramCounter++}`;
      params.push(filter.product_category);
    }
    if (filter.region) {
      queryStr += ` AND region = $${paramCounter++}`;
      params.push(filter.region);
    }

    queryStr += ` GROUP BY channel ORDER BY revenue DESC`;

    const result = await query(queryStr, params);

    return result.rows.map((row: Record<string, unknown>) => ({
      channel: row.channel as string,
      revenue: parseFloat(row.revenue as string),
      cost: parseFloat(row.cost as string),
      margin_percent: parseFloat(row.margin_percent as string),
    }));
  }

  private async getHistoricalMonthlyMargins(organizationID: string, filter: GrossMarginFilter, months: number): Promise<HistoricalMarginPoint[]> {
    const queryStr = `
      WITH monthly_data AS (
        SELECT DATE_TRUNC('month', transaction_date) as month,
               COALESCE(SUM(amount_usd), 0) as monthly_revenue,
               COALESCE(SUM(total_cogs), 0) as monthly_cost
        FROM public.financial_transactions
        WHERE organization_id = $1
          AND transaction_date >= DATE_TRUNC('month', $2) - INTERVAL '${months} months'
          AND transaction_date <= $3
          AND transaction_type IN ('sale', 'subscription')
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month
      )
      SELECT EXTRACT(YEAR FROM month) as year,
             EXTRACT(MONTH FROM month) as month_num,
             month,
             monthly_revenue,
             monthly_cost,
             CASE WHEN monthly_revenue > 0
               THEN ((monthly_revenue - monthly_cost) / monthly_revenue) * 100
               ELSE 0
             END as margin_percent
      FROM monthly_data
    `;

    const result = await query(queryStr, [organizationID, filter.end_date, filter.end_date]);

    return result.rows.map((row: Record<string, unknown>) => ({
      year: parseInt(row.year as string, 10),
      month: parseInt(row.month_num as string, 10),
      date: row.month as Date,
      revenue: parseFloat(row.monthly_revenue as string),
      cost: parseFloat(row.monthly_cost as string),
      margin: parseFloat(row.margin_percent as string),
    }));
  }

  private validateForecastFilter(filter: GrossMarginFilter): Error | null {
    if (!filter.organization_name) return new Error("organization_name is required");
    if (!filter.start_date || !filter.end_date) return new Error("start_date and end_date are required");
    if (filter.start_date > filter.end_date) return new Error("start_date must be before end_date");
    return null;
  }

  private detectSeasonality(data: HistoricalMarginPoint[]): [SeasonalityPoint[], boolean] {
    if (data.length < 24) return [[], false];

    const monthlyMargins: number[][] = Array.from({ length: 13 }, () => []);
    for (const point of data) {
      if (point.month >= 1 && point.month <= 12) {
        monthlyMargins[point.month].push(point.margin);
      }
    }

    const monthlyAvg: number[] = new Array(13).fill(0);
    for (let month = 1; month <= 12; month++) {
      if (monthlyMargins[month].length > 0) {
        const sum = monthlyMargins[month].reduce((a, b) => a + b, 0);
        monthlyAvg[month] = sum / monthlyMargins[month].length;
      }
    }

    let totalSum = 0;
    let totalCount = 0;
    for (let month = 1; month <= 12; month++) {
      if (monthlyAvg[month] > 0) {
        totalSum += monthlyAvg[month];
        totalCount++;
      }
    }

    const overallAvg = totalCount > 0 ? totalSum / totalCount : 0;
    if (overallAvg === 0) return [[], false];

    const seasonalityPoints: SeasonalityPoint[] = [];
    let hasSignificantSeasonality = false;

    for (let month = 1; month <= 12; month++) {
      if (monthlyAvg[month] > 0) {
        const factor = monthlyAvg[month] / overallAvg;
        seasonalityPoints.push({
          month,
          factor,
          typical_margin: monthlyAvg[month],
        });
        if (factor < 0.85 || factor > 1.15) {
          hasSignificantSeasonality = true;
        }
      }
    }

    return [seasonalityPoints, hasSignificantSeasonality];
  }

  private calculateLinearTrend(data: HistoricalMarginPoint[]): TrendResult | null {
    if (data.length < 2) return null;

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = data[i].margin;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = data[i].margin;
      const predicted = slope * x + intercept;
      ssTot += (y - meanY) * (y - meanY);
      ssRes += (y - predicted) * (y - predicted);
    }

    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;

    return { slope, intercept, r2 };
  }

  private getTrendDirection(trend: TrendResult): string {
    if (trend.slope > 0.1) return "up";
    if (trend.slope < -0.1) return "down";
    return "stable";
  }

  private projectNextMonth(_lastValue: number, trend: TrendResult, seasonality: SeasonalityPoint[], monthsAhead: number): number {
    let projected = trend.intercept + trend.slope * (seasonality.length + monthsAhead);

    if (seasonality.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      let targetMonth = currentMonth + monthsAhead;
      targetMonth = ((targetMonth - 1) % 12) + 1;

      for (const s of seasonality) {
        if (s.month === targetMonth) {
          projected = projected * s.factor;
          break;
        }
      }
    }

    if (projected > 100) projected = 100;
    if (projected < -50) projected = -50;

    return projected;
  }

  private projectNextQuarter(lastValue: number, trend: TrendResult, seasonality: SeasonalityPoint[]): number {
    let total = 0;
    for (let i = 1; i <= 3; i++) {
      total += this.projectNextMonth(lastValue, trend, seasonality, i);
    }
    return total / 3;
  }

  private projectNextYear(lastValue: number, trend: TrendResult, seasonality: SeasonalityPoint[]): number {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += this.projectNextMonth(lastValue, trend, seasonality, i);
    }
    return total / 12;
  }

  private calculateConfidenceInterval(data: HistoricalMarginPoint[]): [number, number] {
    if (data.length < 2) return [-999, 999];

    let sum = 0;
    const margins = data.map((p) => p.margin);
    for (const m of margins) sum += m;

    const mean = sum / margins.length;
    let variance = 0;
    for (const m of margins) {
      const diff = m - mean;
      variance += diff * diff;
    }
    variance = variance / margins.length;

    let stdDev = 0;
    if (variance > 0) {
      stdDev = Math.sqrt(variance);
      if (stdDev < 1) stdDev = 1;
    }

    let confidenceMargin = 2.0 * stdDev;
    if (confidenceMargin === 0) confidenceMargin = 5.0;

    let lower = mean - confidenceMargin;
    let upper = mean + confidenceMargin;

    if (lower < -50) lower = -50;
    if (upper > 100) upper = 100;

    return [lower, upper];
  }

  private calculateRMSE(data: HistoricalMarginPoint[], trend: TrendResult, seasonality: SeasonalityPoint[]): number {
    if (data.length < 2) return 999;

    let sumSquaredErrors = 0;
    for (let i = 0; i < data.length; i++) {
      const x = i;
      let predicted = trend.intercept + trend.slope * x;

      if (seasonality.length > 0) {
        for (const s of seasonality) {
          if (s.month === data[i].month) {
            predicted = predicted * s.factor;
            break;
          }
        }
      }

      const error = data[i].margin - predicted;
      sumSquaredErrors += error * error;
    }

    const mse = sumSquaredErrors / data.length;

    let rmse = 0;
    if (mse > 0) {
      if (mse < 1) rmse = 1;
      else if (mse < 4) rmse = 2;
      else if (mse < 9) rmse = 3;
      else if (mse < 16) rmse = 4;
      else rmse = 5;
    }

    return rmse;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}
