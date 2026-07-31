import { query } from "../db";

export interface RevenueDistributionDTO {
  categoryDistribution: Record<string, unknown>[];
  regionDistribution: Record<string, unknown>[];
  channelDistribution: Record<string, unknown>[];
  customerSegmentDistribution: Record<string, unknown>[];
}

export interface SeasonalInsightDTO {
  peakSeasons: Record<string, unknown>[];
  seasonalTrends: Record<string, unknown>;
  yearOverYearGrowth: Record<string, unknown>;
  bestPerformingMonths: Record<string, unknown>[];
}

export interface PriceElasticityDTO {
  categoryElasticity: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  optimalPriceRange: Record<string, unknown>;
}

export interface ExternalFactorsDTO {
  correlations: Record<string, unknown>[];
  impactAnalysis: Record<string, unknown>;
  predictiveInsights: Record<string, unknown>[];
}

export interface RevenueInsightsDTO {
  totalRevenue: number;
  totalQuantity: number;
  avgTransactionValue: number;
  marginByCategory: Record<string, unknown>[];
  revenueTrend: Record<string, unknown>[];
  distribution: RevenueDistributionDTO;
  seasonality: SeasonalInsightDTO;
  priceElasticity: PriceElasticityDTO;
  externalFactors: ExternalFactorsDTO;
}

export class SalesAnalyticsService {
  private async getOrganizationIDByName(organizationName: string): Promise<string> {
    let result = await query(
      `SELECT id, name FROM public.organizations WHERE name ILIKE $1 AND deleted_at IS NULL LIMIT 1`,
      [organizationName]
    );

    if (!result.rows[0]) {
      result = await query(
        `SELECT id, name FROM public.organizations WHERE name ILIKE $1 AND deleted_at IS NULL LIMIT 1`,
        [`%${organizationName}%`]
      );
    }

    if (!result.rows[0]) {
      const orgsResult = await query(`SELECT name FROM public.organizations WHERE deleted_at IS NULL LIMIT 5`);
      const available = orgsResult.rows.length > 0
        ? orgsResult.rows.map((r: Record<string, unknown>) => r.name).join(", ")
        : "none";
      throw new Error(`organization '${organizationName}' not found. Available organizations: ${available}`);
    }

    return result.rows[0].id;
  }

  private async validateOrganizationAccess(
    organizationID: string,
    userOrganizationName?: string,
  ): Promise<void> {
    if (userOrganizationName) {
      const expectedID = await this.getOrganizationIDByName(userOrganizationName);
      if (expectedID !== organizationID) {
        throw new Error(`access denied: User does not have access to organization with ID ${organizationID}`);
      }
    }
  }

  private buildWhereClause(
    filters: string[],
    params: unknown[],
  ): string {
    return filters.join(" AND ");
  }

  private async getDistributionAnalysis(
    whereClause: string,
    params: unknown[],
  ): Promise<RevenueDistributionDTO> {
    const runQuery = async (dimCol: string, dimAlias: string): Promise<Record<string, unknown>[]> => {
      const result = await query(`
        SELECT
          ${dimCol},
          COALESCE(SUM(amount), 0) AS revenue,
          COALESCE(SUM(quantity), 0) AS quantity,
          COUNT(*) AS transactions,
          ROUND(COALESCE(SUM(amount), 0) * 100.0 / NULLIF(SUM(SUM(amount)) OVER(), 0), 2) AS percentage
        FROM public.sales_records
        WHERE ${whereClause}
        GROUP BY ${dimCol}
        ORDER BY revenue DESC
      `, params);

      return result.rows.map((r: Record<string, unknown>) => ({
        [dimAlias]: r[dimCol] || null,
        revenue: Number(r.revenue),
        quantity: Number(r.quantity),
        transactions: Number(r.transactions),
        percentage: Number(r.percentage),
      }));
    };

    const [
      categoryDist,
      regionDist,
      channelDist,
      segmentDist,
    ] = await Promise.all([
      runQuery("category", "category"),
      runQuery("region", "region"),
      runQuery("channel", "channel"),
      runQuery("customer_segment", "customer_segment"),
    ]);

    return {
      categoryDistribution: categoryDist,
      regionDistribution: regionDist,
      channelDistribution: channelDist,
      customerSegmentDistribution: segmentDist,
    };
  }

  private async getSeasonalityInsights(
    whereClause: string,
    params: unknown[],
  ): Promise<SeasonalInsightDTO> {
    const peakResult = await query(`
      SELECT
        EXTRACT(YEAR FROM date) AS year,
        EXTRACT(MONTH FROM date) AS month,
        COALESCE(SUM(amount), 0) AS revenue
      FROM public.sales_records
      WHERE ${whereClause}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY revenue DESC
      LIMIT 6
    `, params);

    const peakSeasons = peakResult.rows.map((r: Record<string, unknown>) => ({
      year: Number(r.year),
      month: Number(r.month),
      revenue: Number(r.revenue),
    }));

    const yoyResult = await query(`
      WITH yearly_revenue AS (
        SELECT
          EXTRACT(YEAR FROM date) AS year,
          COALESCE(SUM(amount), 0) AS revenue
        FROM public.sales_records
        WHERE ${whereClause}
        GROUP BY EXTRACT(YEAR FROM date)
      )
      SELECT
        current.year,
        current.revenue AS current_year_revenue,
        COALESCE(previous.revenue, 0) AS previous_year_revenue,
        CASE WHEN previous.revenue > 0
             THEN ((current.revenue - previous.revenue) / previous.revenue) * 100
             ELSE 0 END AS yoy_growth_percentage
      FROM yearly_revenue current
      LEFT JOIN yearly_revenue previous ON current.year = previous.year + 1
      ORDER BY current.year DESC
    `, params);

    const yoyGrowth: Record<string, unknown> = {};
    for (const row of yoyResult.rows) {
      yoyGrowth[String(Number(row.year))] = {
        revenue: Number(row.current_year_revenue),
        growth_percentage: Number(row.yoy_growth_percentage),
      };
    }

    const bestMonthsResult = await query(`
      SELECT
        EXTRACT(MONTH FROM date) AS month,
        TO_CHAR(DATE_TRUNC('month', date), 'Month') AS month_name,
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_transaction_value
      FROM public.sales_records
      WHERE ${whereClause}
      GROUP BY EXTRACT(MONTH FROM date), DATE_TRUNC('month', date)
      ORDER BY total_revenue DESC
      LIMIT 6
    `, params);

    const bestPerformingMonths = bestMonthsResult.rows.map((r: Record<string, unknown>) => ({
      month: Number(r.month),
      month_name: r.month_name,
      total_revenue: Number(r.total_revenue),
      transaction_count: Number(r.transaction_count),
      avg_transaction_value: Number(r.avg_transaction_value),
    }));

    const strongestSeason = bestPerformingMonths.length > 0 ? String(bestPerformingMonths[0].month_name) : "N/A";
    const seasonalVariance = peakSeasons.length > 3 ? "high" : peakSeasons.length > 1 ? "moderate" : "low";

    const seasonalTrends: Record<string, unknown> = {
      analysis_period: "last_12_months",
      strongest_season: strongestSeason,
      seasonal_variance: seasonalVariance,
    };

    return {
      peakSeasons,
      seasonalTrends,
      yearOverYearGrowth: yoyGrowth,
      bestPerformingMonths,
    };
  }

  private async getPriceElasticity(
    whereClause: string,
    params: unknown[],
  ): Promise<PriceElasticityDTO> {
    const result = await query(`
      SELECT
        category,
        COUNT(*) AS transaction_count,
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(AVG(amount), 0) AS avg_price,
        COALESCE(SUM(quantity), 0) AS total_quantity
      FROM public.sales_records
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total_revenue DESC
    `, params);

    const categoryElasticity = result.rows.map((r: Record<string, unknown>) => ({
      category: r.category || null,
      transaction_count: Number(r.transaction_count),
      total_revenue: Number(r.total_revenue),
      avg_price: Number(r.avg_price),
      total_quantity: Number(r.total_quantity),
    }));

    const recommendations = categoryElasticity.map((item: Record<string, unknown>) => ({
      category: item.category || "Unknown",
      strategy: "Analyze price sensitivity with more historical data",
      elasticity_score: 0,
    }));

    return {
      categoryElasticity,
      recommendations,
      optimalPriceRange: {},
    };
  }

  private async getExternalFactorsAnalysis(
    whereClause: string,
    params: unknown[],
  ): Promise<ExternalFactorsDTO> {
    const result = await query(`
      SELECT
        category,
        COUNT(*) AS transaction_count,
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(AVG(amount), 0) AS avg_transaction_value
      FROM public.sales_records
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total_revenue DESC
      LIMIT 10
    `, params);

    let totalRevenue = 0;
    const correlations = result.rows.map((r: Record<string, unknown>) => {
      const rev = Number(r.total_revenue);
      totalRevenue += rev;
      return {
        category: r.category || null,
        transaction_count: Number(r.transaction_count),
        total_revenue: rev,
        avg_transaction_value: Number(r.avg_transaction_value),
      };
    });

    return {
      correlations,
      impactAnalysis: {
        total_affected_revenue: totalRevenue,
        primary_factors: ["Not enough external factor data available"],
        vulnerable_categories: [],
      },
      predictiveInsights: [
        {
          factor: "general",
          expected_impact: "unknown",
          recommended_action: "Collect more data for better insights",
        },
      ],
    };
  }

  private generateForecastRecommendations(
    forecast: Record<string, unknown>[],
    seasonalIndices: Record<number, number>,
  ): string[] {
    const recommendations: string[] = [];

    const peakMonths = Object.entries(seasonalIndices)
      .map(([month, index]) => ({ month: Number(month), index }))
      .sort((a, b) => b.index - a.index);

    if (peakMonths.length > 0) {
      const topMonths = peakMonths.slice(0, 3).map(pm => String(pm.month));
      recommendations.push(`Prepare inventory and marketing for peak months: ${topMonths.join(", ")}`);
    }

    if (forecast.length >= 2) {
      const firstRevenue = Number(forecast[0].forecasted_revenue);
      const lastRevenue = Number(forecast[forecast.length - 1].forecasted_revenue);

      if (lastRevenue > firstRevenue * 1.2) {
        recommendations.push("Consider increasing production capacity to meet growing demand");
      } else if (lastRevenue < firstRevenue * 0.8) {
        recommendations.push("Implement promotional strategies to counter projected decline");
      }
    }

    return recommendations;
  }

  async getExpansionOpportunities(
    organizationName: string,
    minRevenueThreshold: number,
    userOrganizationName?: string,
  ): Promise<Record<string, unknown>[]> {
    const organizationID = await this.getOrganizationIDByName(organizationName);
    await this.validateOrganizationAccess(organizationID, userOrganizationName);

    const result = await query(`
      WITH region_performance AS (
        SELECT
          region,
          COALESCE(SUM(amount), 0) AS total_revenue,
          COUNT(DISTINCT category) AS categories_sold,
          COUNT(*) AS transaction_count,
          COALESCE(AVG(amount), 0) AS avg_transaction_value
        FROM public.sales_records
        WHERE organization_id = $1
        GROUP BY region
      ),
      top_categories AS (
        SELECT
          region,
          category,
          SUM(amount) AS category_revenue,
          ROW_NUMBER() OVER (PARTITION BY region ORDER BY SUM(amount) DESC) AS rank
        FROM public.sales_records
        WHERE organization_id = $1
        GROUP BY region, category
      )
      SELECT
        rp.region,
        rp.total_revenue,
        rp.categories_sold,
        rp.transaction_count,
        rp.avg_transaction_value,
        tc.category AS top_category,
        tc.category_revenue AS top_category_revenue,
        CASE
          WHEN rp.total_revenue < $2 THEN 'High Growth Potential'
          WHEN rp.total_revenue BETWEEN $2 AND $3 THEN 'Moderate Growth'
          ELSE 'Mature Market'
        END AS expansion_potential
      FROM region_performance rp
      LEFT JOIN top_categories tc ON rp.region = tc.region AND tc.rank = 1
      ORDER BY rp.total_revenue ASC
      LIMIT 10
    `, [organizationID, minRevenueThreshold, minRevenueThreshold * 3]);

    return result.rows.map((r: Record<string, unknown>) => ({
      region: r.region || null,
      total_revenue: Number(r.total_revenue),
      categories_sold: Number(r.categories_sold),
      transaction_count: Number(r.transaction_count),
      avg_transaction_value: Number(r.avg_transaction_value),
      top_category: r.top_category || null,
      top_category_revenue: r.top_category_revenue != null ? Number(r.top_category_revenue) : null,
      expansion_potential: r.expansion_potential,
    }));
  }

  async optimizeProductMix(
    organizationName: string,
    startDate?: string,
    endDate?: string,
    userOrganizationName?: string,
  ): Promise<Record<string, unknown>> {
    const organizationID = await this.getOrganizationIDByName(organizationName);
    await this.validateOrganizationAccess(organizationID, userOrganizationName);

    const filters = ["organization_id = $1"];
    const params: unknown[] = [organizationID];
    let paramIndex = 2;

    if (startDate) {
      filters.push(`date >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      filters.push(`date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = filters.join(" AND ");

    const result = await query(`
      SELECT
        category,
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(SUM(quantity), 0) AS total_quantity,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS avg_transaction_value,
        COUNT(DISTINCT region) AS regions_present
      FROM public.sales_records
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total_revenue DESC
    `, params);

    const optimizationResults: Record<string, unknown>[] = [];
    let stars = 0, cashCows = 0, questionMarks = 0, dogs = 0;

    for (const row of result.rows) {
      const totalRevenue = Number(row.total_revenue);
      optimizationResults.push({
        category: row.category || null,
        total_revenue: totalRevenue,
        total_quantity: Number(row.total_quantity),
        transaction_count: Number(row.transaction_count),
        avg_transaction_value: Number(row.avg_transaction_value),
        regions_present: Number(row.regions_present),
      });

      if (totalRevenue > 10000) stars++;
      else if (totalRevenue > 5000) cashCows++;
      else if (totalRevenue > 1000) questionMarks++;
      else dogs++;
    }

    const recommendations = optimizationResults.slice(0, 5).map((r: Record<string, unknown>) => ({
      category: r.category || "Unknown",
      action: Number(r.total_revenue) > 10000 ? "Focus on high revenue category" : "Consider optimization",
      current_revenue: r.total_revenue,
    }));

    const actionableInsights = optimizationResults.slice(0, 3).map((r: Record<string, unknown>) => {
      const cat = r.category || "Unknown";
      return `Focus on ${cat} - generates $${Number(r.total_revenue).toFixed(2)}`;
    });

    return {
      detailed_analysis: optimizationResults,
      summary: {
        total_categories_analyzed: optimizationResults.length,
        stars,
        cash_cows: cashCows,
        question_marks: questionMarks,
        dogs,
        recommendations,
      },
      actionable_insights: actionableInsights,
    };
  }

  async forecastRevenue(
    organizationName: string,
    monthsAhead: number,
    includeExternalFactors?: boolean,
    userOrganizationName?: string,
  ): Promise<Record<string, unknown>> {
    const organizationID = await this.getOrganizationIDByName(organizationName);
    await this.validateOrganizationAccess(organizationID, userOrganizationName);

    const result = await query(`
      SELECT
        DATE_TRUNC('month', date) AS month,
        SUM(amount) AS revenue,
        EXTRACT(MONTH FROM date) AS month_number
      FROM public.sales_records
      WHERE organization_id = $1
        AND date >= CURRENT_DATE - INTERVAL '24 months'
      GROUP BY DATE_TRUNC('month', date), EXTRACT(MONTH FROM date)
      ORDER BY month ASC
      LIMIT 12
    `, [organizationID]);

    const historicalData: Record<string, unknown>[] = [];
    const monthlyRevenues: number[][] = Array.from({ length: 13 }, () => []);

    for (const row of result.rows) {
      const revenue = Number(row.revenue);
      const monthNumber = Number(row.month_number);
      historicalData.push({
        month: (row.month as Date).toISOString().substring(0, 7),
        revenue,
      });
      if (monthNumber >= 1 && monthNumber <= 12) {
        monthlyRevenues[monthNumber].push(revenue);
      }
    }

    if (historicalData.length === 0) {
      return { error: "No historical data available for forecasting", forecast: [] };
    }

    const seasonalIndices: Record<number, number> = {};
    const allRevenues: number[] = [];

    for (let month = 1; month <= 12; month++) {
      if (monthlyRevenues[month].length > 0) {
        const sum = monthlyRevenues[month].reduce((a, b) => a + b, 0);
        seasonalIndices[month] = sum / monthlyRevenues[month].length;
        allRevenues.push(...monthlyRevenues[month]);
      } else {
        seasonalIndices[month] = 1;
      }
    }

    const avgMonthlyRevenue = allRevenues.length > 0
      ? allRevenues.reduce((a, b) => a + b, 0) / allRevenues.length
      : 0;

    for (let month = 1; month <= 12; month++) {
      seasonalIndices[month] = avgMonthlyRevenue > 0 ? seasonalIndices[month] / avgMonthlyRevenue : 1;
    }

    const lastRevenue = Number(historicalData[historicalData.length - 1].revenue);
    const currentDate = new Date();
    const forecast: Record<string, unknown>[] = [];

    for (let i = 1; i <= monthsAhead; i++) {
      const forecastMonth = ((currentDate.getMonth() + i) % 12) || 12;
      const seasonalFactor = seasonalIndices[forecastMonth] || 1;
      const trendFactor = 1 + i * 0.05;
      const forecastRevenue = lastRevenue * seasonalFactor * trendFactor;

      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      forecast.push({
        month: forecastDate.toISOString().substring(0, 7),
        forecasted_revenue: forecastRevenue,
        seasonal_factor: seasonalFactor,
      });
    }

    const recommendations = this.generateForecastRecommendations(forecast, seasonalIndices);

    return {
      organization_name: organizationName,
      historical_data: historicalData,
      forecast,
      seasonal_indices: seasonalIndices,
      average_monthly_revenue: avgMonthlyRevenue,
      recommendations,
    };
  }

  async getRevenueInsights(
    organizationName: string,
    startDate?: string,
    endDate?: string,
    category?: string,
    region?: string,
    userOrganizationName?: string,
  ): Promise<Record<string, unknown>> {
    const organizationID = await this.getOrganizationIDByName(organizationName);
    await this.validateOrganizationAccess(organizationID, userOrganizationName);

    const filters = ["organization_id = $1"];
    const params: unknown[] = [organizationID];
    let paramIndex = 2;

    if (category) {
      filters.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    if (region) {
      filters.push(`region = $${paramIndex++}`);
      params.push(region);
    }

    const whereClause = filters.join(" AND ");

    const salesResult = await query(`
      SELECT
        id, date, amount, quantity, category, region, channel, customer_segment
      FROM public.sales_records
      WHERE ${whereClause}
      ORDER BY date DESC
    `, params);

    const allSales = salesResult.rows.map((r: Record<string, unknown>) => {
      const sale: Record<string, unknown> = { id: r.id, date: r.date, amount: Number(r.amount) };
      if (r.quantity != null) sale.quantity = Number(r.quantity);
      if (r.category) sale.category = r.category;
      if (r.region) sale.region = r.region;
      if (r.channel) sale.channel = r.channel;
      if (r.customer_segment) sale.customer_segment = r.customer_segment;
      return sale;
    });

    const metricsResult = await query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(SUM(quantity), 0) AS total_quantity,
        COALESCE(AVG(amount), 0) AS avg_transaction_value,
        COUNT(*) AS total_transactions,
        MIN(date) AS first_sale_date,
        MAX(date) AS last_sale_date
      FROM public.sales_records
      WHERE ${whereClause}
    `, params);

    const mr = metricsResult.rows[0];

    return {
      organization_name: organizationName,
      period_analyzed: {
        start_date: mr.first_sale_date ? (mr.first_sale_date as Date).toISOString() : null,
        end_date: mr.last_sale_date ? (mr.last_sale_date as Date).toISOString() : null,
      },
      key_metrics: {
        total_revenue: Number(mr.total_revenue),
        total_quantity: Number(mr.total_quantity),
        avg_transaction_value: Number(mr.avg_transaction_value),
        total_transactions: Number(mr.total_transactions),
      },
      all_sales: allSales,
    };
  }
}
