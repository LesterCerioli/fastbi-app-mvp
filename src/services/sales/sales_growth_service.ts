import { query } from "../db";

export interface SalesRecordCreateDTO {
  organizationName: string;
  amount: number;
  date: Date;
  category?: string;
  productID?: string;
  region?: string;
  channel?: string;
  customerSegment?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface SalesRecordResponseDTO {
  id: string;
  organizationID: string;
  organizationName: string;
  amount: number;
  date: Date;
  category?: string;
  productID?: string;
  region?: string;
  channel?: string;
  customerSegment?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthDataDTO {
  period: string;
  revenue: number;
  growthRate: number;
  previousRevenue?: number;
}

export interface TimeSeriesDataDTO {
  labels: string[];
  datasets: Record<string, unknown>[];
  summary: Record<string, unknown>;
}

export interface TopPerformer {
  name: string;
  totalRevenue: number;
  transactionCount: number;
  averageTransaction: number;
  totalQuantity: number;
}

function round(val: number, precision: number): number {
  const ratio = Math.pow(10, precision);
  return Math.round(val * ratio) / ratio;
}

function sumFloat64(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function averageFloat64(values: number[]): number {
  if (values.length === 0) return 0;
  return sumFloat64(values) / values.length;
}

function maxFloat64(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

function minFloat64(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

function countPositive(values: number[]): number {
  return values.filter(v => v > 0).length;
}

function countNegative(values: number[]): number {
  return values.filter(v => v < 0).length;
}

export class SalesGrowthService {
  private async getOrganizationID(organizationName: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1 AND deleted_at IS NULL`,
      [organizationName]
    );
    if (!result.rows[0]) throw new Error(`organization '${organizationName}' not found`);
    return result.rows[0].id;
  }

  private async getOrganizationName(organizationID: string): Promise<string> {
    const result = await query(
      `SELECT name FROM public.organizations WHERE id = $1 AND deleted_at IS NULL`,
      [organizationID]
    );
    if (!result.rows[0]) throw new Error(`organization with ID ${organizationID} not found`);
    return result.rows[0].name;
  }

  async createSalesRecord(salesData: SalesRecordCreateDTO): Promise<SalesRecordResponseDTO> {
    const organizationID = await this.getOrganizationID(salesData.organizationName);
    const now = new Date();

    const metadataJSON = salesData.metadata ? JSON.stringify(salesData.metadata) : null;

    const result = await query(`
      INSERT INTO public.sales_records (
        organization_id, amount, date, category, product_id,
        region, channel, customer_segment, quantity, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, organization_id, amount, date, category, product_id,
        region, channel, customer_segment, quantity, metadata,
        created_at, updated_at
    `, [
      organizationID,
      salesData.amount,
      salesData.date,
      salesData.category || null,
      salesData.productID || null,
      salesData.region || null,
      salesData.channel || null,
      salesData.customerSegment || null,
      salesData.quantity ?? null,
      metadataJSON,
      now,
      now,
    ]);

    const r = result.rows[0];

    const response: SalesRecordResponseDTO = {
      id: r.id,
      organizationID: r.organization_id,
      organizationName: salesData.organizationName,
      amount: Number(r.amount),
      date: r.date,
      category: r.category || undefined,
      productID: r.product_id || undefined,
      region: r.region || undefined,
      channel: r.channel || undefined,
      customerSegment: r.customer_segment || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };

    if (r.quantity != null) response.quantity = Number(r.quantity);
    if (r.metadata) {
      response.metadata = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
    }

    return response;
  }

  async bulkCreateSalesRecords(records: SalesRecordCreateDTO[]): Promise<number> {
    let createdCount = 0;
    const now = new Date();

    for (const record of records) {
      const organizationID = await this.getOrganizationID(record.organizationName);
      const metadataJSON = record.metadata ? JSON.stringify(record.metadata) : null;

      await query(`
        INSERT INTO public.sales_records (
          organization_id, amount, date, category, product_id,
          region, channel, customer_segment, quantity, metadata,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        organizationID,
        record.amount,
        record.date,
        record.category || null,
        record.productID || null,
        record.region || null,
        record.channel || null,
        record.customerSegment || null,
        record.quantity ?? null,
        metadataJSON,
        now,
        now,
      ]);
      createdCount++;
    }

    return createdCount;
  }

  async getGrowthData(
    organizationName: string,
    startDate: Date,
    endDate: Date,
    groupBy = "month",
    category?: string,
    region?: string,
    channel?: string,
    compareWithPrevious = false,
  ): Promise<TimeSeriesDataDTO> {
    const organizationID = await this.getOrganizationID(organizationName);

    const dateFormatMap: Record<string, string> = {
      day: "YYYY-MM-DD",
      week: "IYYY-IW",
      month: "YYYY-MM",
      quarter: "YYYY-Q",
      year: "YYYY",
    };
    const dateFormat = dateFormatMap[groupBy] || "YYYY-MM";

    let queryStr = `
      WITH period_data AS (
        SELECT
          TO_CHAR(date, '${dateFormat}') AS period,
          COALESCE(SUM(amount), 0) AS total_revenue,
          COUNT(*) AS transaction_count,
          COALESCE(AVG(amount), 0) AS average_transaction,
          COUNT(DISTINCT customer_segment) AS segments_count
        FROM public.sales_records
        WHERE organization_id = $1
          AND date >= $2
          AND date <= $3
    `;

    const params: unknown[] = [organizationID, startDate, endDate];
    let paramIndex = 4;

    if (category) {
      queryStr += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (region) {
      queryStr += ` AND region = $${paramIndex++}`;
      params.push(region);
    }
    if (channel) {
      queryStr += ` AND channel = $${paramIndex++}`;
      params.push(channel);
    }

    queryStr += `
        GROUP BY TO_CHAR(date, '${dateFormat}')
        ORDER BY period
      )
      SELECT * FROM period_data
    `;

    const result = await query(queryStr, params);

    const labels: string[] = [];
    const revenues: number[] = [];
    const growthRates: number[] = [];
    let previousRevenue = 0;

    for (const row of result.rows) {
      const totalRevenue = Number(row.total_revenue);
      labels.push(row.period);
      revenues.push(totalRevenue);

      if (compareWithPrevious && revenues.length > 1) {
        const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        growthRates.push(round(growthRate, 2));
      } else {
        growthRates.push(0);
      }
      previousRevenue = totalRevenue;
    }

    const totalRevenue = sumFloat64(revenues);
    const summary: Record<string, unknown> = {
      total_revenue: round(totalRevenue, 2),
      average_revenue: round(averageFloat64(revenues), 2),
      max_revenue: round(maxFloat64(revenues), 2),
      min_revenue: round(minFloat64(revenues), 2),
      total_periods: labels.length,
      average_growth_rate: round(averageFloat64(growthRates), 2),
      periods_with_growth: countPositive(growthRates),
      periods_with_decline: countNegative(growthRates),
    };

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenues,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Growth Rate (%)",
          data: growthRates,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
      summary,
    };
  }

  async getHistoricalComparison(
    organizationName: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
    category?: string,
    region?: string,
  ): Promise<Record<string, unknown>> {
    const organizationID = await this.getOrganizationID(organizationName);

    const getPeriodData = async (startDate: Date, endDate: Date): Promise<Record<string, unknown>> => {
      let queryStr = `
        SELECT
          COALESCE(SUM(amount), 0) AS total_revenue,
          COUNT(*) AS transaction_count,
          COALESCE(AVG(amount), 0) AS average_transaction,
          COUNT(DISTINCT customer_segment) AS segments_count,
          COUNT(DISTINCT product_id) AS products_count
        FROM public.sales_records
        WHERE organization_id = $1
          AND date >= $2
          AND date <= $3
      `;
      const params: unknown[] = [organizationID, startDate, endDate];
      let paramIndex = 4;

      if (category) {
        queryStr += ` AND category = $${paramIndex++}`;
        params.push(category);
      }
      if (region) {
        queryStr += ` AND region = $${paramIndex}`;
        params.push(region);
      }

      const result = await query(queryStr, params);
      const r = result.rows[0];
      return {
        total_revenue: round(Number(r.total_revenue), 2),
        transaction_count: Number(r.transaction_count),
        average_transaction: round(Number(r.average_transaction), 2),
        segments_count: Number(r.segments_count),
        products_count: Number(r.products_count),
      };
    };

    const currentData = await getPeriodData(currentStart, currentEnd);
    const previousData = await getPeriodData(previousStart, previousEnd);

    const currentRevenue = currentData.total_revenue as number;
    const previousRevenue = previousData.total_revenue as number;
    const revenueChange = currentRevenue - previousRevenue;
    const revenueGrowthRate = previousRevenue > 0 ? (revenueChange / previousRevenue) * 100 : 0;

    const currentTransactions = currentData.transaction_count as number;
    const previousTransactions = previousData.transaction_count as number;
    const transactionChange = currentTransactions - previousTransactions;
    const transactionGrowthRate = previousTransactions > 0 ? (transactionChange / previousTransactions) * 100 : 0;

    let trend = "stable";
    if (revenueGrowthRate > 0) trend = "up";
    else if (revenueGrowthRate < 0) trend = "down";

    return {
      organization_name: organizationName,
      current_period: {
        start_date: currentStart.toISOString(),
        end_date: currentEnd.toISOString(),
        ...currentData,
      },
      previous_period: {
        start_date: previousStart.toISOString(),
        end_date: previousEnd.toISOString(),
        ...previousData,
      },
      comparison: {
        revenue_change: round(revenueChange, 2),
        revenue_growth_rate: round(revenueGrowthRate, 2),
        transaction_change: transactionChange,
        transaction_growth_rate: round(transactionGrowthRate, 2),
        trend,
      },
    };
  }

  async getTopPerformers(
    organizationName: string,
    startDate: Date,
    endDate: Date,
    dimension: string,
    limit = 10,
  ): Promise<TopPerformer[]> {
    const validDimensions = ["category", "product_id", "region", "channel", "customer_segment"];
    if (!validDimensions.includes(dimension)) {
      throw new Error(`invalid dimension. Must be one of: ${validDimensions.join(", ")}`);
    }

    const organizationID = await this.getOrganizationID(organizationName);

    const result = await query(`
      SELECT
        ${dimension} AS name,
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS average_transaction,
        COALESCE(SUM(quantity), 0) AS total_quantity
      FROM public.sales_records
      WHERE organization_id = $1
        AND date >= $2
        AND date <= $3
        AND ${dimension} IS NOT NULL
      GROUP BY ${dimension}
      ORDER BY total_revenue DESC
      LIMIT $4
    `, [organizationID, startDate, endDate, limit]);

    return result.rows.map((r: Record<string, unknown>) => ({
      name: r.name as string,
      totalRevenue: round(Number(r.total_revenue), 2),
      transactionCount: Number(r.transaction_count),
      averageTransaction: round(Number(r.average_transaction), 2),
      totalQuantity: Number(r.total_quantity),
    }));
  }

  async getSalesSummary(
    organizationName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, unknown>> {
    const organizationID = await this.getOrganizationID(organizationName);

    const result = await query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*) AS total_transactions,
        COALESCE(AVG(amount), 0) AS average_transaction,
        COALESCE(MIN(amount), 0) AS min_transaction,
        COALESCE(MAX(amount), 0) AS max_transaction,
        COUNT(DISTINCT category) AS categories_count,
        COUNT(DISTINCT product_id) AS products_count,
        COUNT(DISTINCT region) AS regions_count,
        COUNT(DISTINCT channel) AS channels_count,
        COUNT(DISTINCT customer_segment) AS segments_count
      FROM public.sales_records
      WHERE organization_id = $1
        AND date >= $2
        AND date <= $3
    `, [organizationID, startDate, endDate]);

    const r = result.rows[0];
    const daysCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalRevenue = Number(r.total_revenue);
    const dailyAvg = totalRevenue / daysCount;

    return {
      organization_name: organizationName,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days_count: daysCount,
      },
      summary: {
        total_revenue: round(totalRevenue, 2),
        total_transactions: Number(r.total_transactions),
        average_transaction: round(Number(r.average_transaction), 2),
        min_transaction: round(Number(r.min_transaction), 2),
        max_transaction: round(Number(r.max_transaction), 2),
        daily_average_revenue: round(dailyAvg, 2),
      },
      diversity: {
        categories: Number(r.categories_count),
        products: Number(r.products_count),
        regions: Number(r.regions_count),
        channels: Number(r.channels_count),
        customer_segments: Number(r.segments_count),
      },
    };
  }

  async deleteSalesRecords(
    organizationName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const organizationID = await this.getOrganizationID(organizationName);

    const result = await query(`
      DELETE FROM public.sales_records
      WHERE organization_id = $1
        AND date >= $2
        AND date <= $3
    `, [organizationID, startDate, endDate]);

    return result.rowCount || 0;
  }

  async getMonthlyGrowthData(
    organizationName: string,
    year: number,
    category?: string,
    region?: string,
  ): Promise<Record<string, unknown>> {
    const organizationID = await this.getOrganizationID(organizationName);

    let queryStr = `
      SELECT
        TO_CHAR(date, 'Mon') AS month,
        EXTRACT(MONTH FROM date) AS month_num,
        COALESCE(SUM(amount), 0) AS revenue,
        COUNT(*) AS transaction_count,
        COALESCE(AVG(amount), 0) AS average_transaction
      FROM public.sales_records
      WHERE organization_id = $1
        AND EXTRACT(YEAR FROM date) = $2
    `;

    const params: unknown[] = [organizationID, year];
    let paramIndex = 3;

    if (category) {
      queryStr += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (region) {
      queryStr += ` AND region = $${paramIndex}`;
      params.push(region);
    }

    queryStr += `
      GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
      ORDER BY month_num
    `;

    const result = await query(queryStr, params);

    interface MonthlyData {
      month: string;
      monthNum: number;
      revenue: number;
      transactionCount: number;
      averageTransaction: number;
      growthRate: number;
    }

    const monthlyData: MonthlyData[] = [];
    let totalRevenue = 0;
    let totalTransactions = 0;

    for (const row of result.rows) {
      const md: MonthlyData = {
        month: row.month,
        monthNum: Number(row.month_num),
        revenue: round(Number(row.revenue), 2),
        transactionCount: Number(row.transaction_count),
        averageTransaction: round(Number(row.average_transaction), 2),
        growthRate: 0,
      };
      monthlyData.push(md);
      totalRevenue += md.revenue;
      totalTransactions += md.transactionCount;
    }

    for (let i = 1; i < monthlyData.length; i++) {
      if (monthlyData[i - 1].revenue > 0) {
        const growthRate = ((monthlyData[i].revenue - monthlyData[i - 1].revenue) / monthlyData[i - 1].revenue) * 100;
        monthlyData[i].growthRate = round(growthRate, 2);
      }
    }

    const avgMonthlyRevenue = monthlyData.length > 0 ? round(totalRevenue / monthlyData.length, 2) : 0;

    return {
      organization_name: organizationName,
      year,
      data: monthlyData,
      summary: {
        total_revenue: round(totalRevenue, 2),
        average_monthly_revenue: avgMonthlyRevenue,
        total_transactions: totalTransactions,
        months_with_data: monthlyData.length,
      },
    };
  }
}
