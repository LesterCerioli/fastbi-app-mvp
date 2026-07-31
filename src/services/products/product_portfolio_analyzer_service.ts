import { query } from "../db";

export interface BCGProduct {
  sku: string;
  name: string;
  category: string;
  revenue: number;
  revenueGrowthPct: number;
  marketSharePct: number;
  quadrant: string;
}

export interface BCGMatrix {
  stars: BCGProduct[];
  cashCows: BCGProduct[];
  questionMarks: BCGProduct[];
  dogs: BCGProduct[];
  generatedAt: Date;
}

export interface ProductMarginDeviation {
  sku: string;
  name: string;
  category: string;
  actualMarginPct: number;
  targetMarginPct: number;
  deviationPct: number;
  revenue: number;
  status: string;
}

export interface ProductMarginDeviationResult {
  products: ProductMarginDeviation[];
  aboveTargetCount: number;
  belowTargetCount: number;
  generatedAt: Date;
}

export interface LifecycleStageSummary {
  stage: string;
  productCount: number;
  revenue: number;
  avgMarginPct: number;
  revenuePct: number;
}

export interface LifecycleDistribution {
  stages: LifecycleStageSummary[];
  totalRevenue: number;
  generatedAt: Date;
}

export interface UnderperformingProduct {
  sku: string;
  name: string;
  category: string;
  lifecycleStage: string;
  revenue: number;
  marginPct: number;
  reason: string;
}

export interface UnderperformingResult {
  products: UnderperformingProduct[];
  generatedAt: Date;
}

function classifyBCGQuadrant(growth: number, share: number, medGrowth: number, medShare: number): string {
  const highGrowth = growth > medGrowth;
  const highShare = share > medShare;
  if (highGrowth && highShare) return "star";
  if (!highGrowth && highShare) return "cash_cow";
  if (highGrowth && !highShare) return "question_mark";
  return "dog";
}

function classifyUnderperformingReason(revenue: number, revThreshold: number, margin: number, marginThreshold: number): string {
  const lowRev = revenue < revThreshold;
  const lowMargin = margin < marginThreshold;
  if (lowRev && lowMargin) return "both";
  if (lowRev) return "low_revenue";
  return "low_margin";
}

function computeMedians(products: BCGProduct[]): { medGrowth: number; medShare: number } {
  if (products.length === 0) return { medGrowth: 0, medShare: 0 };
  const growths = products.map(p => p.revenueGrowthPct).sort((a, b) => a - b);
  const shares = products.map(p => p.marketSharePct).sort((a, b) => a - b);
  const mid = Math.floor(products.length / 2);
  return { medGrowth: growths[mid], medShare: shares[mid] };
}

export class ProductPortfolioAnalyzerService {
  private async resolveOrg(orgName: string): Promise<string> {
    const result = await query(`SELECT id FROM public.organizations WHERE name = $1`, [orgName]);
    if (!result.rows[0]) throw new Error(`organization not found: ${orgName}`);
    return result.rows[0].id;
  }

  async getBCGMatrix(orgName: string, lookbackDays = 90): Promise<BCGMatrix> {
    const orgID = await this.resolveOrg(orgName);
    const prev = lookbackDays * 2;

    const result = await query(`
      WITH current_period AS (
        SELECT
          COALESCE(ft.product_name, 'unknown') AS pname,
          COALESCE(p.sku, '') AS sku,
          COALESCE(p.product_category, 'unknown') AS category,
          COALESCE(SUM(ft.amount_usd), 0) AS revenue
        FROM public.financial_transactions ft
        LEFT JOIN public.products p ON p.name = ft.product_name AND p.organization_id = ft.organization_id
        WHERE ft.organization_id = $1
          AND ft.transaction_date >= NOW() - INTERVAL '${lookbackDays} days'
        GROUP BY pname, sku, category
      ),
      prev_period AS (
        SELECT
          COALESCE(product_name, 'unknown') AS pname,
          COALESCE(SUM(amount_usd), 0) AS revenue
        FROM public.financial_transactions
        WHERE organization_id = $1
          AND transaction_date >= NOW() - INTERVAL '${prev} days'
          AND transaction_date < NOW() - INTERVAL '${lookbackDays} days'
        GROUP BY pname
      ),
      total_rev AS (
        SELECT COALESCE(SUM(amount_usd), 1) AS total
        FROM public.financial_transactions
        WHERE organization_id = $1
          AND transaction_date >= NOW() - INTERVAL '${lookbackDays} days'
      )
      SELECT
        c.pname, c.sku, c.category, c.revenue,
        COALESCE(CASE WHEN COALESCE(pr.revenue, 0) > 0 THEN ((c.revenue - pr.revenue) / pr.revenue) * 100 ELSE 0 END, 0) AS growth_pct,
        (c.revenue / t.total) * 100 AS share_pct
      FROM current_period c
      CROSS JOIN total_rev t
      LEFT JOIN prev_period pr ON pr.pname = c.pname
      ORDER BY c.revenue DESC
    `, [orgID]);

    const products: BCGProduct[] = [];
    for (const row of result.rows) {
      products.push({
        sku: row.sku || "",
        name: row.pname,
        category: row.category,
        revenue: Number(row.revenue),
        revenueGrowthPct: Number(row.growth_pct),
        marketSharePct: Number(row.share_pct),
        quadrant: "",
      });
    }

    const { medGrowth, medShare } = computeMedians(products);
    const matrix: BCGMatrix = {
      stars: [],
      cashCows: [],
      questionMarks: [],
      dogs: [],
      generatedAt: new Date(),
    };

    for (const p of products) {
      p.quadrant = classifyBCGQuadrant(p.revenueGrowthPct, p.marketSharePct, medGrowth, medShare);
      switch (p.quadrant) {
        case "star": matrix.stars.push(p); break;
        case "cash_cow": matrix.cashCows.push(p); break;
        case "question_mark": matrix.questionMarks.push(p); break;
        default: matrix.dogs.push(p); break;
      }
    }

    return matrix;
  }

  async compareMarginVsTarget(orgName: string): Promise<ProductMarginDeviationResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        p.sku,
        p.name,
        p.product_category,
        COALESCE(AVG(ft.transaction_margin_percent), 0) AS actual_margin,
        COALESCE(p.target_margin_percent, 0) AS target_margin,
        COALESCE(SUM(ft.amount_usd), 0) AS revenue
      FROM public.products p
      LEFT JOIN public.financial_transactions ft
        ON ft.product_name = p.name AND ft.organization_id = p.organization_id
      WHERE p.organization_id = $1
        AND p.is_active = true
        AND p.target_margin_percent IS NOT NULL
      GROUP BY p.sku, p.name, p.product_category, p.target_margin_percent
      ORDER BY (COALESCE(AVG(ft.transaction_margin_percent), 0) - p.target_margin_percent) ASC
    `, [orgID]);

    const devResult: ProductMarginDeviationResult = {
      products: [],
      aboveTargetCount: 0,
      belowTargetCount: 0,
      generatedAt: new Date(),
    };

    for (const row of result.rows) {
      const actualMargin = Number(row.actual_margin);
      const targetMargin = Number(row.target_margin);
      const deviation = actualMargin - targetMargin;
      let status = "on_target";
      if (deviation > 2) {
        status = "above_target";
        devResult.aboveTargetCount++;
      } else if (deviation < -2) {
        status = "below_target";
        devResult.belowTargetCount++;
      }

      devResult.products.push({
        sku: row.sku,
        name: row.name,
        category: row.product_category,
        actualMarginPct: actualMargin,
        targetMarginPct: targetMargin,
        deviationPct: deviation,
        revenue: Number(row.revenue),
        status,
      });
    }

    return devResult;
  }

  async getLifecycleDistribution(orgName: string): Promise<LifecycleDistribution> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        COALESCE(p.lifecycle_stage, 'unknown') AS stage,
        COUNT(DISTINCT p.id) AS product_count,
        COALESCE(SUM(ft.amount_usd), 0) AS revenue,
        COALESCE(AVG(ft.transaction_margin_percent), 0) AS avg_margin
      FROM public.products p
      LEFT JOIN public.financial_transactions ft
        ON ft.product_name = p.name AND ft.organization_id = p.organization_id
      WHERE p.organization_id = $1
      GROUP BY stage
      ORDER BY revenue DESC
    `, [orgID]);

    const dist: LifecycleDistribution = {
      stages: [],
      totalRevenue: 0,
      generatedAt: new Date(),
    };

    const stages: LifecycleStageSummary[] = [];
    for (const row of result.rows) {
      const ls: LifecycleStageSummary = {
        stage: row.stage,
        productCount: Number(row.product_count),
        revenue: Number(row.revenue),
        avgMarginPct: Number(row.avg_margin),
        revenuePct: 0,
      };
      dist.totalRevenue += ls.revenue;
      stages.push(ls);
    }

    for (const s of stages) {
      if (dist.totalRevenue > 0) {
        s.revenuePct = (s.revenue / dist.totalRevenue) * 100;
      }
    }
    dist.stages = stages;

    return dist;
  }

  async identifyUnderperformingProducts(
    orgName: string,
    revenueThreshold = 1000,
    marginThreshold = 10,
  ): Promise<UnderperformingResult> {
    const orgID = await this.resolveOrg(orgName);

    const result = await query(`
      SELECT
        p.sku,
        p.name,
        p.product_category,
        COALESCE(p.lifecycle_stage, 'active'),
        COALESCE(SUM(ft.amount_usd), 0) AS revenue,
        COALESCE(AVG(ft.transaction_margin_percent), 0) AS margin_pct
      FROM public.products p
      LEFT JOIN public.financial_transactions ft
        ON ft.product_name = p.name AND ft.organization_id = p.organization_id
      WHERE p.organization_id = $1
        AND p.is_active = true
      GROUP BY p.sku, p.name, p.product_category, p.lifecycle_stage
      HAVING SUM(ft.amount_usd) < $2 OR AVG(ft.transaction_margin_percent) < $3
      ORDER BY revenue ASC
    `, [orgID, revenueThreshold, marginThreshold]);

    const underperforming: UnderperformingResult = {
      products: [],
      generatedAt: new Date(),
    };

    for (const row of result.rows) {
      underperforming.products.push({
        sku: row.sku,
        name: row.name,
        category: row.product_category,
        lifecycleStage: row.lifecycle_stage || "active",
        revenue: Number(row.revenue),
        marginPct: Number(row.margin_pct),
        reason: classifyUnderperformingReason(Number(row.revenue), revenueThreshold, Number(row.margin_pct), marginThreshold),
      });
    }

    return underperforming;
  }
}
