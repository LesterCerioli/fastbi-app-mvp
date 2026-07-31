import { query } from "../db";

export interface SeasonalityRequest {
  organizationId: string;
  granularity: string;
  compareYears: number[];
}

export interface SeasonalMetric {
  periodName: string;
  values: Record<number, number>;
  average: number;
  variance: number;
  isHighSeason: boolean;
}

export interface PeakPeriod {
  period: string;
  year: number;
  value: number;
  percentageAboveAvg: number;
}

export interface LowPeriod {
  period: string;
  year: number;
  value: number;
  percentageBelowAvg: number;
}

export interface SeasonalityAnalysis {
  seasonalPatterns: Record<string, SeasonalMetric>;
  peakPeriods: PeakPeriod[];
  lowPeriods: LowPeriod[];
  yearOverYearChange: Record<string, number>;
  recommendations: string[];
}

export interface GrowthRequest {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  includeCAGR: boolean;
}

export interface PeriodGrowth {
  period: string;
  startValue: number;
  endValue: number;
  growth: number;
  growthPercent: number;
}

export interface GrowthAnalysis {
  absoluteGrowth: number;
  percentageGrowth: number;
  periodBreakdown: PeriodGrowth[];
  cagr: number;
  growthRate: number;
  trendDirection: string;
  volatility: number;
}

export interface PeriodDef {
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface DailyMetric {
  date: Date;
  value: number;
}

export interface PeriodResult {
  label: string;
  totalValue: number;
  averagePerDay: number;
  daysInPeriod: number;
  peakDay: DailyMetric;
  lowestDay: DailyMetric;
}

export interface SegmentComparison {
  segmentName: string;
  period1Value: number;
  period2Value: number;
  difference: number;
  percentChange: number;
}

export interface PeriodComparisonRequest {
  organizationId: string;
  period1: PeriodDef;
  period2: PeriodDef;
  groupBy: string;
}

export interface PeriodComparison {
  period1: PeriodResult;
  period2: PeriodResult;
  absoluteDifference: number;
  percentageDifference: number;
  segmentedComparison: Record<string, SegmentComparison>;
  insights: string[];
}

export interface SummaryRequest {
  organizationId: string;
  currentDate: Date;
  lookbackDays: number;
}

export interface CurrentPeriodMetrics {
  periodLabel: string;
  totalValue: number;
  vsPreviousPeriod: number;
  vsPreviousPercent: number;
  projectedTotal: number;
  onTrackPercent: number;
}

export interface GrowthIndicators {
  dailyGrowth: number;
  monthlyGrowth: number;
}

export interface SeasonalAlert {
  isPeakSeason: boolean;
  currentSeason: string;
  expectedIncrease: number;
  daysUntilPeak: number;
}

export interface Opportunity {
  title: string;
  description: string;
  impact: string;
  actionable: string;
}

export interface RiskFactor {
  title: string;
  description: string;
  severity: string;
  mitigation: string;
}

export interface ExecutiveSummary {
  currentPeriod: CurrentPeriodMetrics;
  growthIndicators: GrowthIndicators;
  seasonalAlert: SeasonalAlert;
  topOpportunities: Opportunity[];
  riskFactors: RiskFactor[];
  executiveRecommendations: string[];
}

export class ExecutiveAnalyticsImpl {
  async compareSeasonality(req: SeasonalityRequest): Promise<SeasonalityAnalysis> {
    if (!req.organizationId) throw new Error("organization_id is required");
    if (!req.granularity) req.granularity = "month";

    let groupByExpr: string;
    let periodNameExpr: string;

    switch (req.granularity) {
      case "month":
        groupByExpr = "EXTRACT(MONTH FROM date)";
        periodNameExpr = `CASE
          WHEN EXTRACT(MONTH FROM date) = 1 THEN 'January'
          WHEN EXTRACT(MONTH FROM date) = 2 THEN 'February'
          WHEN EXTRACT(MONTH FROM date) = 3 THEN 'March'
          WHEN EXTRACT(MONTH FROM date) = 4 THEN 'April'
          WHEN EXTRACT(MONTH FROM date) = 5 THEN 'May'
          WHEN EXTRACT(MONTH FROM date) = 6 THEN 'June'
          WHEN EXTRACT(MONTH FROM date) = 7 THEN 'July'
          WHEN EXTRACT(MONTH FROM date) = 8 THEN 'August'
          WHEN EXTRACT(MONTH FROM date) = 9 THEN 'September'
          WHEN EXTRACT(MONTH FROM date) = 10 THEN 'October'
          WHEN EXTRACT(MONTH FROM date) = 11 THEN 'November'
          WHEN EXTRACT(MONTH FROM date) = 12 THEN 'December'
        END`;
        break;
      case "quarter":
        groupByExpr = "EXTRACT(QUARTER FROM date)";
        periodNameExpr = `CASE
          WHEN EXTRACT(QUARTER FROM date) = 1 THEN 'Q1'
          WHEN EXTRACT(QUARTER FROM date) = 2 THEN 'Q2'
          WHEN EXTRACT(QUARTER FROM date) = 3 THEN 'Q3'
          WHEN EXTRACT(QUARTER FROM date) = 4 THEN 'Q4'
        END`;
        break;
      default:
        groupByExpr = "EXTRACT(MONTH FROM date)";
        periodNameExpr = "TO_CHAR(date, 'Month')";
    }

    let yearFilter = "";
    if (req.compareYears && req.compareYears.length > 0) {
      yearFilter = `AND EXTRACT(YEAR FROM date) IN (${req.compareYears.join(",")})`;
    }

    const sql = `
      SELECT
        EXTRACT(YEAR FROM date) as year,
        ${groupByExpr} as period_key,
        ${periodNameExpr} as period_name,
        COALESCE(SUM(amount), 0) as total_sales
      FROM public.sales_records
      WHERE organization_id = $1
        AND date >= NOW() - INTERVAL '36 months'
        ${yearFilter}
      GROUP BY year, period_key, period_name
      ORDER BY year, period_key
    `;

    const r = await query(sql, [req.organizationId]);

    const seasonalMap: Record<string, Record<number, number>> = {};
    const periodNames: Record<string, string> = {};

    for (const row of r.rows) {
      const year = Number(row.year);
      const periodKey = Number(row.period_key);
      const periodName: string = row.period_name?.trim() ?? "";
      const totalSales = Number(row.total_sales);

      const key = `${req.granularity}_${periodKey}`;
      if (!seasonalMap[key]) seasonalMap[key] = {};
      seasonalMap[key][year] = totalSales;
      periodNames[key] = periodName;
    }

    const analysis: SeasonalityAnalysis = {
      seasonalPatterns: {},
      peakPeriods: [],
      lowPeriods: [],
      yearOverYearChange: {},
      recommendations: [],
    };

    const overallAvg = this.calculateOverallAverage(seasonalMap);

    for (const [key, yearValues] of Object.entries(seasonalMap)) {
      let total = 0;
      let count = 0;
      let maxValue = -Infinity;
      let minValue = Infinity;
      let maxYear = 0;
      let minYear = 0;

      for (const [yearStr, val] of Object.entries(yearValues)) {
        const year = Number(yearStr);
        total += val;
        count++;
        if (val > maxValue) { maxValue = val; maxYear = year; }
        if (val < minValue) { minValue = val; minYear = year; }
      }

      const avg = total / count;

      let variance = 0;
      for (const val of Object.values(yearValues)) {
        variance += Math.pow(val - avg, 2);
      }
      variance /= count;

      const isHighSeason = avg > overallAvg * 1.15;

      analysis.seasonalPatterns[key] = {
        periodName: periodNames[key],
        values: yearValues,
        average: avg,
        variance,
        isHighSeason,
      };

      if (maxValue > avg * 1.3) {
        analysis.peakPeriods.push({
          period: periodNames[key],
          year: maxYear,
          value: maxValue,
          percentageAboveAvg: ((maxValue - avg) / avg) * 100,
        });
      }

      if (minValue < avg * 0.7) {
        analysis.lowPeriods.push({
          period: periodNames[key],
          year: minYear,
          value: minValue,
          percentageBelowAvg: ((avg - minValue) / avg) * 100,
        });
      }

      if (req.compareYears && req.compareYears.length >= 2) {
        const y1 = req.compareYears[0];
        const y2 = req.compareYears[1];
        if (yearValues[y1] !== undefined && yearValues[y2] !== undefined && yearValues[y1] > 0) {
          const change = ((yearValues[y2] - yearValues[y1]) / yearValues[y1]) * 100;
          analysis.yearOverYearChange[periodNames[key]] = change;
        }
      }
    }

    analysis.recommendations = this.generateSeasonalityRecommendations(analysis);
    return analysis;
  }

  async calculateGrowth(req: GrowthRequest): Promise<GrowthAnalysis> {
    if (!req.organizationId) throw new Error("organization_id is required");
    if (!req.interval) req.interval = "month";

    const startR = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date <= $2`,
      [req.organizationId, req.startDate]
    );
    const startValue = Number(startR.rows[0].coalesce ?? 0);

    const endR = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date <= $2`,
      [req.organizationId, req.endDate]
    );
    const endValue = Number(endR.rows[0].coalesce ?? 0);

    const absoluteGrowth = endValue - startValue;
    const percentageGrowth = startValue > 0 ? (absoluteGrowth / startValue) * 100 : 0;

    const analysis: GrowthAnalysis = {
      absoluteGrowth,
      percentageGrowth,
      periodBreakdown: [],
      cagr: 0,
      growthRate: 0,
      trendDirection: "stable",
      volatility: 0,
    };

    if (req.includeCAGR) {
      const yearsMs = req.endDate.getTime() - req.startDate.getTime();
      const years = yearsMs / (365 * 24 * 60 * 60 * 1000);
      if (years > 0 && startValue > 0) {
        analysis.cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      }
    }

    let currentStart = new Date(req.startDate);
    while (currentStart < req.endDate) {
      let currentEnd: Date;
      switch (req.interval) {
        case "day": currentEnd = new Date(currentStart); currentEnd.setDate(currentEnd.getDate() + 1); break;
        case "week": currentEnd = new Date(currentStart); currentEnd.setDate(currentEnd.getDate() + 7); break;
        case "month": currentEnd = new Date(currentStart); currentEnd.setMonth(currentEnd.getMonth() + 1); break;
        case "quarter": currentEnd = new Date(currentStart); currentEnd.setMonth(currentEnd.getMonth() + 3); break;
        default: currentEnd = new Date(currentStart); currentEnd.setMonth(currentEnd.getMonth() + 1);
      }

      if (currentEnd > req.endDate) currentEnd = new Date(req.endDate);

      const psR = await query(
        `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date <= $2`,
        [req.organizationId, currentStart]
      );
      const periodStartValue = Number(psR.rows[0].coalesce ?? 0);

      const peR = await query(
        `SELECT COALESCE(SUM(amount), 0) FROM sales_records WHERE organization_id = $1 AND date <= $2`,
        [req.organizationId, currentEnd]
      );
      const periodEndValue = Number(peR.rows[0].coalesce ?? 0);

      const periodGrowth = periodEndValue - periodStartValue;
      const periodGrowthPercent = periodStartValue > 0 ? (periodGrowth / periodStartValue) * 100 : 0;

      analysis.periodBreakdown.push({
        period: `${this.formatDate(currentStart)} to ${this.formatDate(currentEnd)}`,
        startValue: periodStartValue,
        endValue: periodEndValue,
        growth: periodGrowth,
        growthPercent: periodGrowthPercent,
      });

      currentStart = currentEnd;
    }

    if (analysis.periodBreakdown.length > 0) {
      let totalGrowth = 0;
      for (const pg of analysis.periodBreakdown) totalGrowth += pg.growthPercent;
      analysis.growthRate = totalGrowth / analysis.periodBreakdown.length;

      if (analysis.growthRate > 5) analysis.trendDirection = "increasing";
      else if (analysis.growthRate < -5) analysis.trendDirection = "decreasing";
      else analysis.trendDirection = "stable";

      let variances = 0;
      for (const pg of analysis.periodBreakdown) {
        variances += Math.pow(pg.growthPercent - analysis.growthRate, 2);
      }
      analysis.volatility = Math.sqrt(variances / analysis.periodBreakdown.length);
    }

    return analysis;
  }

  async comparePeriods(req: PeriodComparisonRequest): Promise<PeriodComparison> {
    if (!req.organizationId) throw new Error("organization_id is required");

    const period1Result = await this.calculatePeriodMetrics(req.organizationId, req.period1);
    const period2Result = await this.calculatePeriodMetrics(req.organizationId, req.period2);

    const comparison: PeriodComparison = {
      period1: period1Result,
      period2: period2Result,
      absoluteDifference: period2Result.totalValue - period1Result.totalValue,
      percentageDifference: 0,
      segmentedComparison: {},
      insights: [],
    };

    if (period1Result.totalValue > 0) {
      comparison.percentageDifference = ((period2Result.totalValue - period1Result.totalValue) / period1Result.totalValue) * 100;
    }

    if (req.groupBy === "category") {
      const segR = await query(
        `SELECT
           category as segment,
           COALESCE(SUM(CASE WHEN date BETWEEN $1 AND $2 THEN amount ELSE 0 END), 0) as period1_value,
           COALESCE(SUM(CASE WHEN date BETWEEN $3 AND $4 THEN amount ELSE 0 END), 0) as period2_value
         FROM public.sales_records
         WHERE organization_id = $5
           AND (date BETWEEN $1 AND $2 OR date BETWEEN $3 AND $4)
         GROUP BY category`,
        [req.period1.startDate, req.period1.endDate, req.period2.startDate, req.period2.endDate, req.organizationId]
      );

      for (const row of segR.rows) {
        const val1 = Number(row.period1_value);
        const val2 = Number(row.period2_value);
        const diff = val2 - val1;
        const percentChange = val1 > 0 ? (diff / val1) * 100 : 0;

        comparison.segmentedComparison[row.segment] = {
          segmentName: row.segment,
          period1Value: val1,
          period2Value: val2,
          difference: diff,
          percentChange,
        };
      }
    }

    comparison.insights = this.generateComparisonInsights(comparison, req);
    return comparison;
  }

  async getExecutiveSummary(req: SummaryRequest): Promise<ExecutiveSummary> {
    if (!req.organizationId) throw new Error("organization_id is required");
    if (!req.lookbackDays) req.lookbackDays = 90;

    const currentPeriodStart = new Date(req.currentDate);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - req.lookbackDays);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - req.lookbackDays);

    const curR = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [req.organizationId, currentPeriodStart, req.currentDate]
    );
    const currentValue = Number(curR.rows[0].coalesce ?? 0);

    const prevR = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [req.organizationId, previousPeriodStart, currentPeriodStart]
    );
    const previousValue = Number(prevR.rows[0].coalesce ?? 0);

    const daysElapsed = Math.max(1, Math.floor((req.currentDate.getTime() - currentPeriodStart.getTime()) / (24 * 60 * 60 * 1000)));
    const dailyAverage = currentValue / daysElapsed;
    const projectedTotal = dailyAverage * req.lookbackDays;
    const onTrackPercent = (currentValue / projectedTotal) * 100;
    const vsPreviousPercent = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

    const summary: ExecutiveSummary = {
      currentPeriod: {
        periodLabel: `Last ${req.lookbackDays} days`,
        totalValue: currentValue,
        vsPreviousPeriod: currentValue - previousValue,
        vsPreviousPercent,
        projectedTotal,
        onTrackPercent,
      },
      growthIndicators: await this.calculateGrowthIndicators(req),
      seasonalAlert: await this.checkSeasonalAlert(req),
      topOpportunities: await this.identifyOpportunities(req),
      riskFactors: await this.identifyRisks(req),
      executiveRecommendations: [],
    };

    summary.executiveRecommendations = this.generateExecutiveRecommendations(summary);
    return summary;
  }

  private async calculatePeriodMetrics(organizationId: string, period: PeriodDef): Promise<PeriodResult> {
    const r = await query(
      `SELECT
         COALESCE(SUM(amount), 0) as total,
         COUNT(DISTINCT date) as days
       FROM public.sales_records
       WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [organizationId, period.startDate, period.endDate]
    );

    const totalValue = Number(r.rows[0].total);
    const daysInPeriod = Number(r.rows[0].days) || 1;

    let peakDayDate = new Date();
    let peakDayValue = 0;
    try {
      const peakR = await query(
        `SELECT date, COALESCE(amount, 0) as val
         FROM public.sales_records
         WHERE organization_id = $1 AND date BETWEEN $2 AND $3
         ORDER BY amount DESC LIMIT 1`,
        [organizationId, period.startDate, period.endDate]
      );
      if (peakR.rows.length > 0) {
        peakDayDate = peakR.rows[0].date;
        peakDayValue = Number(peakR.rows[0].val);
      }
    } catch { /* ignore */ }

    let lowestDayDate = new Date();
    let lowestDayValue = 0;
    try {
      const lowR = await query(
        `SELECT date, COALESCE(amount, 0) as val
         FROM public.sales_records
         WHERE organization_id = $1 AND date BETWEEN $2 AND $3 AND amount > 0
         ORDER BY amount ASC LIMIT 1`,
        [organizationId, period.startDate, period.endDate]
      );
      if (lowR.rows.length > 0) {
        lowestDayDate = lowR.rows[0].date;
        lowestDayValue = Number(lowR.rows[0].val);
      }
    } catch { /* ignore */ }

    return {
      label: period.label,
      totalValue,
      averagePerDay: totalValue / daysInPeriod,
      daysInPeriod,
      peakDay: { date: peakDayDate, value: peakDayValue },
      lowestDay: { date: lowestDayDate, value: lowestDayValue },
    };
  }

  private calculateOverallAverage(seasonalMap: Record<string, Record<number, number>>): number {
    let total = 0;
    let count = 0;
    for (const yearValues of Object.values(seasonalMap)) {
      for (const val of Object.values(yearValues)) {
        total += val;
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }

  private async calculateGrowthIndicators(req: SummaryRequest): Promise<GrowthIndicators> {
    const today = req.currentDate;

    const last7Start = new Date(today); last7Start.setDate(last7Start.getDate() - 7);
    const prev7Start = new Date(last7Start); prev7Start.setDate(prev7Start.getDate() - 7);

    const last7R = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [req.organizationId, last7Start, today]
    );
    const last7Value = Number(last7R.rows[0].coalesce ?? 0);

    const prev7R = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [req.organizationId, prev7Start, last7Start]
    );
    const prev7Value = Number(prev7R.rows[0].coalesce ?? 0);

    const indicators: GrowthIndicators = { dailyGrowth: 0, monthlyGrowth: 0 };
    if (prev7Value > 0) indicators.dailyGrowth = ((last7Value - prev7Value) / prev7Value) * 100;

    const last30Start = new Date(today); last30Start.setDate(last30Start.getDate() - 30);
    const prev30Start = new Date(last30Start); prev30Start.setDate(prev30Start.getDate() - 30);

    const last30R = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [req.organizationId, last30Start, today]
    );
    const last30Value = Number(last30R.rows[0].coalesce ?? 0);

    const prev30R = await query(
      `SELECT COALESCE(SUM(amount), 0) FROM public.sales_records WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
      [req.organizationId, prev30Start, last30Start]
    );
    const prev30Value = Number(prev30R.rows[0].coalesce ?? 0);

    if (prev30Value > 0) indicators.monthlyGrowth = ((last30Value - prev30Value) / prev30Value) * 100;

    return indicators;
  }

  private generateSeasonalityRecommendations(analysis: SeasonalityAnalysis): string[] {
    const recs: string[] = [];

    for (const peak of analysis.peakPeriods) {
      recs.push(`Increase inventory and marketing budget in ${peak.period} (historically +${peak.percentageAboveAvg.toFixed(1)}% above average)`);
    }

    for (const low of analysis.lowPeriods) {
      recs.push(`Plan maintenance or training during ${low.period} (historically -${low.percentageBelowAvg.toFixed(1)}% below average)`);
    }

    for (const [period, change] of Object.entries(analysis.yearOverYearChange)) {
      if (change > 15) {
        recs.push(`Strong YoY growth in ${period} (+${change.toFixed(1)}%) - investigate success factors`);
      } else if (change < -10) {
        recs.push(`YoY decline in ${period} (${change.toFixed(1)}%) - implement recovery actions`);
      }
    }

    if (recs.length === 0) {
      recs.push("Sales patterns are stable - continue monitoring seasonality trends");
    }

    return recs;
  }

  private generateComparisonInsights(comparison: PeriodComparison, req: PeriodComparisonRequest): string[] {
    const insights: string[] = [];
    const pctDiff = comparison.percentageDifference;

    if (pctDiff > 10) {
      insights.push(`${req.period2.label} performed ${pctDiff.toFixed(1)}% better than ${req.period1.label} - excellent growth!`);
    } else if (pctDiff > 0) {
      insights.push(`${req.period2.label} showed positive growth of ${pctDiff.toFixed(1)}% compared to ${req.period1.label}`);
    } else if (pctDiff < -10) {
      insights.push(`${req.period2.label} declined ${Math.abs(pctDiff).toFixed(1)}% compared to ${req.period1.label} - requires attention`);
    } else if (pctDiff < 0) {
      insights.push(`${req.period2.label} declined ${Math.abs(pctDiff).toFixed(1)}% compared to ${req.period1.label} - monitor closely`);
    } else {
      insights.push("Performance was stable between periods");
    }

    const dayDiff = comparison.period2.averagePerDay - comparison.period1.averagePerDay;
    if (dayDiff > 0 && comparison.period1.averagePerDay > 0) {
      insights.push(`Daily average increased by ${dayDiff.toFixed(2)} (${((dayDiff / comparison.period1.averagePerDay) * 100).toFixed(1)}% lift)`);
    }

    return insights;
  }

  private generateExecutiveRecommendations(summary: ExecutiveSummary): string[] {
    const recs: string[] = [];

    if (summary.currentPeriod.vsPreviousPercent > 10) {
      recs.push("Double down on current strategies - strong positive momentum detected");
    } else if (summary.currentPeriod.vsPreviousPercent < -10) {
      recs.push("Immediate action required: Review recent changes and run diagnostic analysis");
    } else if (summary.currentPeriod.vsPreviousPercent < 0) {
      recs.push("Monitor performance closely - slight negative trend detected");
    }

    if (summary.currentPeriod.onTrackPercent < 80) {
      recs.push("Below target - consider accelerating marketing efforts or promotions");
    } else if (summary.currentPeriod.onTrackPercent > 120) {
      recs.push("Exceeding targets - consider increasing targets or expanding capacity");
    }

    if (summary.seasonalAlert.isPeakSeason) {
      recs.push(`Prepare for +${summary.seasonalAlert.expectedIncrease.toFixed(1)}% expected increase - increase inventory and staff`);
    }

    for (const opp of summary.topOpportunities) {
      if (opp.impact === "high") {
        recs.push(opp.actionable);
      }
    }

    if (recs.length === 0) {
      recs.push("Maintain current strategy - metrics within expected ranges");
    }

    return recs;
  }

  private async checkSeasonalAlert(req: SummaryRequest): Promise<SeasonalAlert> {
    const alert: SeasonalAlert = {
      isPeakSeason: false,
      currentSeason: "normal",
      expectedIncrease: 0,
      daysUntilPeak: 0,
    };

    const currentMonth = req.currentDate.getMonth() + 1;

    const avgCurR = await query(
      `SELECT AVG(monthly_avg) FROM (
         SELECT EXTRACT(MONTH FROM date) as month, AVG(amount) as monthly_avg
         FROM public.sales_records
         WHERE organization_id = $1 AND date >= NOW() - INTERVAL '24 months'
         GROUP BY EXTRACT(MONTH FROM date)
       ) monthly_data WHERE month = $2`,
      [req.organizationId, currentMonth]
    );
    const avgCurrentMonth = Number(avgCurR.rows[0].avg ?? 0);

    const avgOtherR = await query(
      `SELECT AVG(monthly_avg) FROM (
         SELECT EXTRACT(MONTH FROM date) as month, AVG(amount) as monthly_avg
         FROM public.sales_records
         WHERE organization_id = $1 AND date >= NOW() - INTERVAL '24 months'
         GROUP BY EXTRACT(MONTH FROM date)
       ) monthly_data WHERE month != $2`,
      [req.organizationId, currentMonth]
    );
    const avgOtherMonths = Number(avgOtherR.rows[0].avg ?? 0);

    if (avgCurrentMonth > avgOtherMonths * 1.2) {
      alert.isPeakSeason = true;
      alert.expectedIncrease = ((avgCurrentMonth - avgOtherMonths) / avgOtherMonths) * 100;
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      alert.currentSeason = `${monthNames[currentMonth - 1]} Peak Season`;
    }

    return alert;
  }

  private async identifyOpportunities(req: SummaryRequest): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    try {
      const catR = await query(
        `SELECT category,
           ((SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) -
             SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END)) /
             NULLIF(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)) * 100 as growth
         FROM public.sales_records
         WHERE organization_id = $1 AND category IS NOT NULL AND category != ''
         GROUP BY category
         HAVING SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) > 0
         ORDER BY growth DESC LIMIT 1`,
        [req.organizationId]
      );

      if (catR.rows.length > 0) {
        const category = catR.rows[0].category;
        const growthPercent = Number(catR.rows[0].growth);
        if (category && growthPercent > 20) {
          opportunities.push({
            title: `Expand ${category} Category`,
            description: `${category} category is growing at ${growthPercent.toFixed(1)}% month-over-month`,
            impact: "high",
            actionable: `Increase marketing budget for ${category} by 25%`,
          });
        }
      }
    } catch { /* ignore */ }

    try {
      const chR = await query(
        `SELECT channel, SUM(amount) as revenue
         FROM public.sales_records
         WHERE organization_id = $1 AND channel IS NOT NULL AND date >= NOW() - INTERVAL '90 days'
         GROUP BY channel ORDER BY revenue DESC LIMIT 1`,
        [req.organizationId]
      );

      if (chR.rows.length > 0) {
        const channel = chR.rows[0].channel;
        const revenue = Number(chR.rows[0].revenue);
        if (channel) {
          opportunities.push({
            title: `Leverage ${channel} Channel`,
            description: `${channel} channel generated ${revenue.toFixed(2)} in last 90 days`,
            impact: "medium",
            actionable: `Double down on ${channel} marketing campaigns`,
          });
        }
      }
    } catch { /* ignore */ }

    return opportunities;
  }

  private async identifyRisks(req: SummaryRequest): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];

    try {
      const catR = await query(
        `SELECT category,
           ((SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) -
             SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END)) /
             NULLIF(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)) * 100 as decline
         FROM public.sales_records
         WHERE organization_id = $1 AND category IS NOT NULL AND category != ''
         GROUP BY category
         HAVING SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) > 0
         ORDER BY decline ASC LIMIT 1`,
        [req.organizationId]
      );

      if (catR.rows.length > 0) {
        const category = catR.rows[0].category;
        const declinePercent = Number(catR.rows[0].decline);
        if (category && declinePercent < -20) {
          risks.push({
            title: `${category} Category Decline`,
            description: `${category} category declined ${Math.abs(declinePercent).toFixed(1)}% in last 30 days`,
            severity: "critical",
            mitigation: `Launch promotion for ${category} category immediately`,
          });
        }
      }
    } catch { /* ignore */ }

    return risks;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}
