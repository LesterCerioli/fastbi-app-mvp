import type { CurrentMetrics } from "./planner";

export interface DetectedAnomaly {
  metric: string;
  dimension: string;
  dimensionValue: string;
  expectedValue: number;
  actualValue: number;
  zScore: number;
  detectedAt: Date;
}

export interface RootCause {
  dimension: string;
  value: string;
  contribution: number;
  confidence: number;
  explanation: string;
}

export interface ActionScore {
  action: string;
  score: number;
  urgency: number;
  impact: number;
  confidence: number;
  reason: string;
}

export class Reasoner {
  scoreAction(
    action: string,
    currentMetrics: CurrentMetrics | null,
    anomalies: DetectedAnomaly[],
    rootCauses: RootCause[]
  ): number {
    let score = 0.5;

    switch (action) {
      case "detect_anomalies":
        score = this.scoreAnomalyDetection(currentMetrics, anomalies);
        break;
      case "find_opportunities":
        score = this.scoreOpportunityDetection(currentMetrics);
        break;
      case "diagnose_decline":
        score = this.scoreDeclineDiagnosis(currentMetrics);
        break;
      case "generate_forecast":
        score = this.scoreForecast(currentMetrics);
        break;
      case "compare_periods":
        score = this.scoreComparison(currentMetrics);
        break;
    }

    return Math.min(score, 1.0);
  }

  scoreActions(
    actions: string[],
    currentMetrics: CurrentMetrics | null,
    anomalies: DetectedAnomaly[],
    rootCauses: RootCause[]
  ): ActionScore[] {
    const scores: ActionScore[] = [];

    for (const action of actions) {
      const score = this.scoreAction(action, currentMetrics, anomalies, rootCauses);
      const urgency = this.calculateUrgency(action, currentMetrics, anomalies);
      const impact = this.calculateImpact(action, currentMetrics, rootCauses);
      const confidence = this.calculateConfidence(action, currentMetrics, anomalies);

      scores.push({
        action,
        score,
        urgency,
        impact,
        confidence,
        reason: this.generateReason(action, currentMetrics, anomalies),
      });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores;
  }

  private scoreAnomalyDetection(metrics: CurrentMetrics | null, anomalies: DetectedAnomaly[]): number {
    if (!metrics) return 0.5;

    if (anomalies.length > 0) {
      const criticalCount = anomalies.filter((a) => Math.abs(a.zScore) > 3).length;
      if (criticalCount > 0) return 0.95;
      return 0.7;
    }

    if (metrics.growthRate < -20) return 0.85;
    if (Math.abs(metrics.growthRate) > 15) return 0.7;
    return 0.4;
  }

  private scoreOpportunityDetection(metrics: CurrentMetrics | null): number {
    if (!metrics) return 0.5;
    if (metrics.growthRate > 10) return 0.9;
    if (metrics.growthRate > 5) return 0.7;
    if (metrics.growthRate < -10) return 0.6;
    return 0.4;
  }

  private scoreDeclineDiagnosis(metrics: CurrentMetrics | null): number {
    if (!metrics) return 0.5;
    if (metrics.growthRate < -15) return 0.95;
    if (metrics.growthRate < -5) return 0.8;
    if (metrics.growthRate < 0) return 0.6;
    return 0.3;
  }

  private scoreForecast(metrics: CurrentMetrics | null): number {
    if (!metrics) return 0.5;
    if (Math.abs(metrics.growthRate) > 10) return 0.8;
    return 0.5;
  }

  private scoreComparison(_metrics: CurrentMetrics | null): number {
    return 0.6;
  }

  private calculateUrgency(action: string, metrics: CurrentMetrics | null, anomalies: DetectedAnomaly[]): number {
    switch (action) {
      case "detect_anomalies":
        if (anomalies.length > 0) {
          let maxZScore = 0;
          for (const a of anomalies) {
            if (Math.abs(a.zScore) > maxZScore) maxZScore = Math.abs(a.zScore);
          }
          return Math.min(1.0, maxZScore / 4.0);
        }
        return 0.3;

      case "diagnose_decline":
        if (metrics && metrics.growthRate < -20) return 1.0;
        if (metrics && metrics.growthRate < -10) return 0.8;
        return 0.4;

      case "find_opportunities":
        if (metrics && metrics.growthRate > 20) return 0.9;
        return 0.5;

      default:
        return 0.5;
    }
  }

  private calculateImpact(action: string, metrics: CurrentMetrics | null, rootCauses: RootCause[]): number {
    switch (action) {
      case "diagnose_decline":
        if (metrics && metrics.growthRate < -10) return 0.9;
        return 0.6;

      case "find_opportunities":
        if (metrics && metrics.growthRate > 10) return 0.85;
        return 0.5;

      case "detect_anomalies":
        for (const rc of rootCauses) {
          if (rc.contribution > 0.3) return 0.8;
        }
        return 0.5;

      default:
        return 0.5;
    }
  }

  private calculateConfidence(_action: string, metrics: CurrentMetrics | null, _anomalies: DetectedAnomaly[]): number {
    if (!metrics) return 0.3;
    if (metrics.totalRevenue === 0) return 0.2;
    if (metrics.transactionCount < 10) return 0.4;
    if (metrics.transactionCount < 100) return 0.6;
    return 0.85;
  }

  private generateReason(action: string, metrics: CurrentMetrics | null, anomalies: DetectedAnomaly[]): string {
    switch (action) {
      case "detect_anomalies":
        if (anomalies.length > 0) return "Unresolved anomalies detected that require investigation";
        if (metrics && Math.abs(metrics.growthRate) > 15) return "High volatility suggests potential anomalies";
        return "Routine anomaly check recommended";

      case "diagnose_decline":
        if (metrics && metrics.growthRate < -15) return "Critical decline detected - immediate diagnosis needed";
        if (metrics && metrics.growthRate < 0) return "Negative trend detected - investigate root causes";
        return "Monitor for potential decline";

      case "find_opportunities":
        if (metrics && metrics.growthRate > 15) return "Strong growth pattern - identify expansion opportunities";
        if (metrics && metrics.growthRate > 5) return "Positive trend - find areas to accelerate";
        return "Look for growth opportunities in specific segments";

      default:
        return "Standard analysis recommended";
    }
  }
}
