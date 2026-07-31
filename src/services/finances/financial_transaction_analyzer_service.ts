import { query } from "../db";

export interface COGSBreakdown {
  totalRevenue: number;
  totalCOGS: number;
  overallMarginPct: number;
  directMaterial: number;
  directLabor: number;
  manufacturing: number;
  freightIn: number;
  royalties: number;
  commission: number;
  shipping: number;
  paymentFees: number;
  packaging: number;
  fixedDirectAllocated: number;
  largestCostDriver: string;
  generatedAt: Date;
}

export interface DimensionMarginItem {
  dimension: string;
  revenue: number;
  cogs: number;
  marginPct: number;
  transactionCount: number;
}

export interface MarginDimensionComparison {
  dimension: string;
  items: DimensionMarginItem[];
  bestPerformer: string;
  worstPerformer: string;
  avgMarginPct: number;
  generatedAt: Date;
}

export interface MarginLeak {
  productName: string;
  category: string;
  channel: string;
  region: string;
  avgMarginPct: number;
  orgAvgMarginPct: number;
  deviationPct: number;
  revenue: number;
  transactionCount: number;
}

export interface MarginLeakResult {
  leaks: MarginLeak[];
  orgAvgMarginPct: number;
  generatedAt: Date;
}

export interface ChannelProfitability {
  channel: string;
  revenue: number;
  marginPct: number;
  transactionCount: number;
  avgOrderValue: number;
  marginRank: number;
}

export interface ChannelProfitabilityResult {
  channels: ChannelProfitability[];
  bestChannelByMargin: string;
  generatedAt: Date;
}

export interface PeriodMarginComparison {
  period1Label: string;
  period2Label: string;
  period1MarginPct: number;
  period2MarginPct: number;
  absoluteChangePp: number;
  trend: string;
  generatedAt: Date;
}

export class FinancialTransactionAnalyzerService {
  private async resolveOrg(orgName: string): Promise<string> {
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [orgName]);
    if (!result.rows[0]) throw new Error(`organization not found: ${orgName}`);
    return result.rows[0].id;
  }

  private buildDateFilter(orgID: string, startDate?: string, endDate?: string): { clause: string; params: unknown[] } {
    const params: unknown[] = [orgID];
    let clause = "organization_id = $1";
    if (startDate) {
      params.push(startDate);
      clause += ` AND transaction_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      clause += ` AND transaction_date <= $${params.length}`;
    }
    return { clause, params };
  }

  private largestDriver(bd: COGSBreakdown): string {
    const drivers: Record<string, number> = {
      direct_material: bd.directMaterial,
      direct_labor: bd.directLabor,
      manufacturing: bd.manufacturing,
      freight_in: bd.freightIn,
      royalties: bd.royalties,
      commission: bd.commission,
      shipping: bd.shipping,
      payment_fees: bd.paymentFees,
      packaging: bd.packaging,
      fixed_direct_allocated: bd.fixedDirectAllocated,
    };
    let best = "";
    let bestVal = -1;
    for (const [k, v] of Object.entries(drivers)) {
      if (v > bestVal) {
        bestVal = v;
        best = k;
      }
    }
    return best;
  }

  async analyzeCOGSBreakdown(orgName: string, startDate?: string, endDate?: string): Promise<COGSBreakdown> {
    const orgID = await this.resolveOrg(orgName);
    const { clause, params } = this.buildDateFilter(orgID, startDate, endDate);

    const result = await query(`
      SELECT
        COALESCE(SUM(amount_usd), 0) AS total_revenue,
        COALESCE(SUM(total_cogs), 0) AS total_cogs,
        COALESCE(SUM(cogs_direct_material), 0) AS direct_material,
        COALESCE(SUM(cogs_direct_labor), 0) AS direct_labor,
        COALESCE(SUM(cogs_manufacturing), 0) AS manufacturing,
        COALESCE(SUM(cogs_freight_in), 0) AS freight_in,
        COALESCE(SUM(cogs_royalties), 0) AS royalties,
        COALESCE(SUM(variable_commission), 0) AS commission,
        COALESCE(SUM(variable_shipping), 0) AS shipping,
        COALESCE(SUM(variable_payment_fees), 0) AS payment_fees,
        COALESCE(SUM(variable_packaging), 0) AS packaging,
        COALESCE(SUM(fixed_direct_allocated), 0) AS fixed_direct_allocated
      FROM public.financial_transactions
      WHERE ${clause}
    `, params);

    const r = result.rows[0];
    const bd: COGSBreakdown = {
      totalRevenue: Number(r.total_revenue),
      totalCOGS: Number(r.total_cogs),
      overallMarginPct: 0,
      directMaterial: Number(r.direct_material),
      directLabor: Number(r.direct_labor),
      manufacturing: Number(r.manufacturing),
      freightIn: Number(r.freight_in),
      royalties: Number(r.royalties),
      commission: Number(r.commission),
      shipping: Number(r.shipping),
      paymentFees: Number(r.payment_fees),
      packaging: Number(r.packaging),
      fixedDirectAllocated: Number(r.fixed_direct_allocated),
      largestCostDriver: "",
      generatedAt: new Date(),
    };

    if (bd.totalRevenue > 0) {
      bd.overallMarginPct = ((bd.totalRevenue - bd.totalCOGS) / bd.totalRevenue) * 100;
    }
    bd.largestCostDriver = this.largestDriver(bd);

    return bd;
  }

  async compareMarginByDimension(orgName: string, dimension: string): Promise<MarginDimensionComparison> {
    const allowedDimensions: Record<string, string> = {
      channel: "channel",
      region: "region",
      customer_tier: "customer_tier",
      product_category: "product_category",
    };
    const col = allowedDimensions[dimension];
    if (!col) {
      throw new Error(`unsupported dimension: ${dimension} (use: channel, region, customer_tier, product_category)`);
    }

    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        COALESCE(${col}, 'unknown') AS dim,
        COALESCE(SUM(amount_usd), 0) AS revenue,
        COALESCE(SUM(total_cogs), 0) AS cogs,
        COALESCE(AVG(transaction_margin_percent), 0) AS margin_pct,
        COUNT(*) AS tx_count
      FROM public.financial_transactions
      WHERE organization_id = $1
      GROUP BY dim
      ORDER BY margin_pct DESC
    `, [orgID]);

    const items: DimensionMarginItem[] = [];
    let totalMargin = 0;
    for (const row of result.rows) {
      items.push({
        dimension: row.dim,
        revenue: Number(row.revenue),
        cogs: Number(row.cogs),
        marginPct: Number(row.margin_pct),
        transactionCount: Number(row.tx_count),
      });
      totalMargin += Number(row.margin_pct);
    }

    const comparison: MarginDimensionComparison = {
      dimension,
      items,
      bestPerformer: items.length > 0 ? items[0].dimension : "",
      worstPerformer: items.length > 0 ? items[items.length - 1].dimension : "",
      avgMarginPct: items.length > 0 ? totalMargin / items.length : 0,
      generatedAt: new Date(),
    };

    return comparison;
  }

  async identifyMarginLeaks(orgName: string, thresholdPct = 10): Promise<MarginLeakResult> {
    const orgID = await this.resolveOrg(orgName);

    const avgResult = await query(
      `SELECT COALESCE(AVG(transaction_margin_percent), 0) AS avg_margin FROM public.financial_transactions WHERE organization_id = $1`,
      [orgID]
    );
    const orgAvg = Number(avgResult.rows[0]?.avg_margin || 0);
    const leakThreshold = orgAvg - thresholdPct;

    const result = await query(`
      SELECT
        COALESCE(product_name, 'unknown') AS product_name,
        COALESCE(product_category, 'unknown') AS category,
        COALESCE(channel, 'unknown') AS channel,
        COALESCE(region, 'unknown') AS region,
        COALESCE(AVG(transaction_margin_percent), 0) AS avg_margin,
        COALESCE(SUM(amount_usd), 0) AS revenue,
        COUNT(*) AS tx_count
      FROM public.financial_transactions
      WHERE organization_id = $1
      GROUP BY product_name, product_category, channel, region
      HAVING AVG(transaction_margin_percent) < $2
      ORDER BY avg_margin ASC
      LIMIT 50
    `, [orgID, leakThreshold]);

    const leaks: MarginLeak[] = [];
    for (const row of result.rows) {
      const avgMargin = Number(row.avg_margin);
      leaks.push({
        productName: row.product_name,
        category: row.category,
        channel: row.channel,
        region: row.region,
        avgMarginPct: avgMargin,
        orgAvgMarginPct: orgAvg,
        deviationPct: orgAvg - avgMargin,
        revenue: Number(row.revenue),
        transactionCount: Number(row.tx_count),
      });
    }

    return {
      leaks,
      orgAvgMarginPct: orgAvg,
      generatedAt: new Date(),
    };
  }

  async getChannelProfitability(orgName: string, lookbackDays = 90): Promise<ChannelProfitabilityResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        COALESCE(channel, 'unknown') AS channel,
        COALESCE(SUM(amount_usd), 0) AS revenue,
        COALESCE(AVG(transaction_margin_percent), 0) AS margin_pct,
        COUNT(*) AS tx_count,
        COALESCE(AVG(amount_usd), 0) AS avg_order
      FROM public.financial_transactions
      WHERE organization_id = $1
        AND transaction_date >= NOW() - INTERVAL '${lookbackDays} days'
      GROUP BY channel
      ORDER BY margin_pct DESC
    `, [orgID]);

    const channels: ChannelProfitability[] = [];
    let rank = 1;
    for (const row of result.rows) {
      channels.push({
        channel: row.channel,
        revenue: Number(row.revenue),
        marginPct: Number(row.margin_pct),
        transactionCount: Number(row.tx_count),
        avgOrderValue: Number(row.avg_order),
        marginRank: rank++,
      });
    }

    return {
      channels,
      bestChannelByMargin: channels.length > 0 ? channels[0].channel : "",
      generatedAt: new Date(),
    };
  }

  async comparePeriodMargins(orgName: string, period1Days: number, period2Days: number): Promise<PeriodMarginComparison> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        COALESCE(AVG(CASE WHEN transaction_date >= NOW() - INTERVAL '${period1Days} days' THEN transaction_margin_percent END), 0) AS m1,
        COALESCE(AVG(CASE WHEN transaction_date >= NOW() - INTERVAL '${period2Days} days'
                           AND transaction_date < NOW() - INTERVAL '${period1Days} days' THEN transaction_margin_percent END), 0) AS m2
      FROM public.financial_transactions
      WHERE organization_id = $1
    `, [orgID]);

    const m1 = Number(result.rows[0]?.m1 || 0);
    const m2 = Number(result.rows[0]?.m2 || 0);
    const change = m1 - m2;
    let trend = "stable";
    if (change > 1) trend = "improving";
    else if (change < -1) trend = "declining";

    return {
      period1Label: `last_${period1Days}_days`,
      period2Label: `${period1Days}_to_${period2Days}_days_ago`,
      period1MarginPct: m1,
      period2MarginPct: m2,
      absoluteChangePp: change,
      trend,
      generatedAt: new Date(),
    };
  }
}
