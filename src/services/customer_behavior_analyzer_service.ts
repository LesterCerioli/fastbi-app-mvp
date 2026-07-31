import { query } from "./db";

export interface TierMetrics {
  tier: string;
  count: number;
  avg_ltv: number;
  avg_margin_pct: number;
  active_count: number;
  high_risk_count: number;
  avg_days_since_last_purchase: number;
}

export interface CustomerTierComparison {
  tiers: TierMetrics[];
  best_tier_by_ltv: string;
  best_tier_by_margin: string;
  riskiest_tier: string;
  generated_at: Date;
}

export interface AtRiskCustomer {
  customer_code: string;
  legal_name: string;
  tier: string;
  risk_level: string;
  days_since_last_purchase: number;
  lifetime_value: number;
  region: string;
  risk_score: number;
}

export interface AtRiskCustomerResult {
  customers: AtRiskCustomer[];
  total_at_risk: number;
  generated_at: Date;
}

export interface SegmentCell {
  tier: string;
  region: string;
  customer_count: number;
  avg_ltv: number;
  avg_margin_pct: number;
  active_rate: number;
}

export interface SegmentBehaviorResult {
  cells: SegmentCell[];
  top_segment: SegmentCell;
  generated_at: Date;
}

export interface ChurnSignal {
  customer_code: string;
  legal_name: string;
  tier: string;
  days_since_last_purchase: number;
  lifetime_value: number;
  churn_probability: number;
  reason: string;
}

export interface ChurnSignalResult {
  signals: ChurnSignal[];
  total_signals: number;
  estimated_ltv_at_risk: number;
  generated_at: Date;
}

export class CustomerBehaviorAnalyzerService {
  private async resolveOrg(name: string): Promise<string> {
    if (!name) throw new Error("organization_name is required");
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [name]
    );
    if (!result.rows[0]) {
      throw new Error(`organization not found: ${name}`);
    }
    return result.rows[0].id;
  }

  async compareTiers(orgName: string): Promise<CustomerTierComparison> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        customer_tier AS tier,
        COUNT(*) AS count,
        COALESCE(AVG(lifetime_value), 0) AS avg_ltv,
        COALESCE(AVG(average_margin_percent), 0) AS avg_margin_pct,
        COUNT(*) FILTER (WHERE is_active = true) AS active_count,
        COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count,
        COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - last_purchase_date::timestamptz)) / 86400), 0) AS avg_days_since_last_purchase
       FROM public.customers
       WHERE organization_id = $1
       GROUP BY customer_tier
       ORDER BY avg_ltv DESC`,
      [orgID]
    );

    const tiers: TierMetrics[] = result.rows;
    const comparison: CustomerTierComparison = {
      tiers,
      best_tier_by_ltv: "",
      best_tier_by_margin: "",
      riskiest_tier: "",
      generated_at: new Date(),
    };

    let topLTV = -1, topMargin = -1, topRiskRate = -1;
    for (const t of tiers) {
      if (t.avg_ltv > topLTV) { topLTV = t.avg_ltv; comparison.best_tier_by_ltv = t.tier; }
      if (t.avg_margin_pct > topMargin) { topMargin = t.avg_margin_pct; comparison.best_tier_by_margin = t.tier; }
      if (t.count > 0) {
        const riskRate = t.high_risk_count / t.count;
        if (riskRate > topRiskRate) { topRiskRate = riskRate; comparison.riskiest_tier = t.tier; }
      }
    }

    return comparison;
  }

  async identifyAtRiskCustomers(orgName: string, inactiveDays = 90): Promise<AtRiskCustomerResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        customer_code,
        legal_name,
        customer_tier AS tier,
        risk_level,
        COALESCE(EXTRACT(EPOCH FROM (NOW() - last_purchase_date::timestamptz)) / 86400, 9999) AS days_since,
        COALESCE(lifetime_value, 0) AS lifetime_value,
        COALESCE(region, 'unknown') AS region
       FROM public.customers
       WHERE organization_id = $1
         AND is_active = true
         AND (
           risk_level = 'high'
           OR EXTRACT(EPOCH FROM (NOW() - last_purchase_date::timestamptz)) / 86400 > $2
         )
       ORDER BY lifetime_value DESC
       LIMIT 100`,
      [orgID, inactiveDays]
    );

    const customers: AtRiskCustomer[] = result.rows.map((row: any) => ({
      customer_code: row.customer_code,
      legal_name: row.legal_name,
      tier: row.tier,
      risk_level: row.risk_level,
      days_since_last_purchase: row.days_since,
      lifetime_value: row.lifetime_value,
      region: row.region,
      risk_score: this.computeCustomerRiskScore(row.risk_level, row.days_since, inactiveDays),
    }));

    return {
      customers,
      total_at_risk: customers.length,
      generated_at: new Date(),
    };
  }

  async getSegmentBehaviorPatterns(orgName: string): Promise<SegmentBehaviorResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        customer_tier AS tier,
        COALESCE(region, 'unknown') AS region,
        COUNT(*) AS customer_count,
        COALESCE(AVG(lifetime_value), 0) AS avg_ltv,
        COALESCE(AVG(average_margin_percent), 0) AS avg_margin_pct,
        COALESCE(AVG(CASE WHEN is_active THEN 1.0 ELSE 0.0 END), 0) AS active_rate
       FROM public.customers
       WHERE organization_id = $1
       GROUP BY customer_tier, region
       ORDER BY avg_ltv DESC`,
      [orgID]
    );

    const cells: SegmentCell[] = result.rows;
    return {
      cells,
      top_segment: cells.length > 0 ? cells[0] : ({} as SegmentCell),
      generated_at: new Date(),
    };
  }

  async getChurnSignals(orgName: string, lookbackDays = 60): Promise<ChurnSignalResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(
      `SELECT
        customer_code,
        legal_name,
        customer_tier AS tier,
        COALESCE(EXTRACT(EPOCH FROM (NOW() - last_purchase_date::timestamptz)) / 86400, 9999) AS days_since,
        COALESCE(lifetime_value, 0) AS lifetime_value
       FROM public.customers
       WHERE organization_id = $1
         AND is_active = true
         AND last_purchase_date IS NOT NULL
         AND EXTRACT(EPOCH FROM (NOW() - last_purchase_date::timestamptz)) / 86400 > $2
       ORDER BY lifetime_value DESC
       LIMIT 100`,
      [orgID, lookbackDays]
    );

    let totalLTV = 0;
    const signals: ChurnSignal[] = result.rows.map((row: any) => {
      const churnProb = this.computeChurnProbability(row.days_since, lookbackDays);
      totalLTV += row.lifetime_value;
      return {
        customer_code: row.customer_code,
        legal_name: row.legal_name,
        tier: row.tier,
        days_since_last_purchase: row.days_since,
        lifetime_value: row.lifetime_value,
        churn_probability: churnProb,
        reason: this.classifyChurnReason(row.days_since, lookbackDays),
      };
    });

    return {
      signals,
      total_signals: signals.length,
      estimated_ltv_at_risk: totalLTV,
      generated_at: new Date(),
    };
  }

  private computeCustomerRiskScore(riskLevel: string, daysSince: number, inactiveDays: number): number {
    let score = 0;
    if (riskLevel === "high") score += 0.5;
    else if (riskLevel === "medium") score += 0.25;
    if (daysSince > 0) {
      score += Math.min(daysSince / (inactiveDays * 2), 0.5);
    }
    return Math.min(score, 1.0);
  }

  private computeChurnProbability(daysSince: number, threshold: number): number {
    if (daysSince <= threshold) return 0;
    return Math.min((daysSince - threshold) / (threshold * 2), 1.0);
  }

  private classifyChurnReason(daysSince: number, threshold: number): string {
    const extra = daysSince - threshold;
    if (extra > threshold * 2) return "severely_inactive";
    if (extra > threshold) return "highly_inactive";
    return "moderately_inactive";
  }
}
