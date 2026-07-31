import type { CurrentMetrics } from "./planner";
import type { DetectedAnomaly, RootCause } from "./reasoner";
import type { BehavioralPattern } from "./behavioral_memory";

export class RecommendationGenerator {
  generate(
    metrics: CurrentMetrics | null,
    anomalies: DetectedAnomaly[],
    rootCauses: RootCause[],
    similarPatterns: BehavioralPattern[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics) {
      recommendations.push(...this.generateGrowthRecommendations(metrics));
    }
    if (anomalies.length > 0) {
      recommendations.push(...this.generateAnomalyRecommendations(anomalies));
    }
    if (rootCauses.length > 0) {
      recommendations.push(...this.generateRootCauseRecommendations(rootCauses));
    }
    if (similarPatterns.length > 0) {
      recommendations.push(...this.generatePatternBasedRecommendations(similarPatterns));
    }

    const seen = new Set<string>();
    return recommendations.filter((r) => {
      if (seen.has(r)) return false;
      seen.add(r);
      return true;
    });
  }

  generateOpportunities(
    metrics: CurrentMetrics | null,
    growingDimensions: Record<string, any>[],
    seasonalPattern: Record<string, number>
  ): string[] {
    const opportunities: string[] = [];

    if (metrics && metrics.growthRate > 10) {
      opportunities.push(`Capitalize on strong momentum: ${metrics.growthRate.toFixed(1)}% growth rate suggests expansion opportunity`);
    }

    for (const dim of growingDimensions) {
      if (typeof dim["dimension"] === "string" && typeof dim["growth_percent"] === "number" && dim["growth_percent"] > 20) {
        opportunities.push(`Rapidly growing segment: ${dim["dimension"]} at ${dim["growth_percent"]}% growth - increase investment`);
      }
    }

    let peakMonth = "";
    let peakValue = 0;
    for (const [month, value] of Object.entries(seasonalPattern)) {
      if (value > peakValue) {
        peakValue = value;
        peakMonth = month;
      }
    }

    if (peakMonth) {
      opportunities.push(`Prepare for seasonal peak in ${peakMonth} - historical average indicates higher sales`);
    }

    if (opportunities.length === 0) {
      opportunities.push("Monitor market conditions for emerging opportunities");
    }

    return opportunities;
  }

  private generateGrowthRecommendations(metrics: CurrentMetrics): string[] {
    const recs: string[] = [];

    if (metrics.growthRate > 15) {
      recs.push(`Accelerate growth strategy: ${metrics.growthRate.toFixed(1)}% growth exceeds targets - consider increasing targets by 20%`);
      recs.push("Expand marketing budget for top-performing channels");
    } else if (metrics.growthRate > 5) {
      recs.push(`Sustain positive momentum: ${metrics.growthRate.toFixed(1)}% growth - optimize conversion funnels`);
    } else if (metrics.growthRate < -15) {
      recs.push(`Critical decline detected: ${Math.abs(metrics.growthRate).toFixed(1)}% drop - implement immediate recovery plan`);
      recs.push("Pause non-essential spending and review pricing strategy");
    } else if (metrics.growthRate < 0) {
      recs.push(`Negative trend: ${Math.abs(metrics.growthRate).toFixed(1)}% decline - conduct root cause analysis`);
    }

    if (metrics.averageOrderValue < 100 && metrics.transactionCount > 100) {
      recs.push("Low average order value detected - implement upselling and cross-selling strategies");
    }

    return recs;
  }

  private generateAnomalyRecommendations(anomalies: DetectedAnomaly[]): string[] {
    const recs: string[] = [];

    for (const a of anomalies) {
      if (a.zScore > 3) {
        if (a.actualValue > a.expectedValue) {
          recs.push(`Unusual spike detected: ${a.metric} is ${(((a.actualValue - a.expectedValue) / a.expectedValue) * 100).toFixed(1)}% above normal - investigate what caused the success`);
        } else {
          recs.push(`Critical anomaly: ${a.metric} dropped ${(((a.expectedValue - a.actualValue) / a.expectedValue) * 100).toFixed(1)}% below expected - immediate investigation required`);
        }
      } else if (a.zScore > 2) {
        if (a.actualValue < a.expectedValue) {
          recs.push(`Unusual pattern: ${a.metric} below normal range - monitor closely for next 7 days`);
        }
      }
    }

    return recs;
  }

  private generateRootCauseRecommendations(rootCauses: RootCause[]): string[] {
    const recs: string[] = [];

    for (const rc of rootCauses) {
      if (rc.contribution > 0.3) {
        recs.push(`Focus on ${rc.dimension}: ${rc.value} contributed ${(rc.contribution * 100).toFixed(0)}% of the change - prioritize this area`);
      }
      if (rc.contribution > 0.5) {
        recs.push(`Deep dive required: ${rc.value} ${rc.dimension} is the primary driver - schedule detailed analysis`);
      }
    }

    return recs;
  }

  private generatePatternBasedRecommendations(patterns: BehavioralPattern[]): string[] {
    const recs: string[] = [];

    for (const p of patterns) {
      if (p.effectiveness > 0.8) {
        recs.push(`Historical success pattern found: ${p.actionTaken} was effective with ${(p.effectiveness * 100).toFixed(0)}% success rate - consider reapplying`);
      }
    }

    return recs;
  }
}
