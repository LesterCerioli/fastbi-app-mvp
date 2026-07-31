import type { RootCause } from "./reasoner";

export interface DimensionBreakdown {
  name: string;
  value: string;
  before: number;
  after: number;
}

export class RootCauseAnalyzer {
  explainDecline(totalBefore: number, totalAfter: number, dimensions: DimensionBreakdown[]): RootCause[] {
    if (totalBefore === totalAfter || totalBefore === 0) return [];

    const totalDecline = totalBefore - totalAfter;
    if (totalDecline <= 0) return [];

    const causes: RootCause[] = [];

    for (const dim of dimensions) {
      const decline = dim.before - dim.after;
      if (decline <= 0) continue;

      const contribution = decline / totalDecline;
      if (contribution > 0.05) {
        const confidence = this.calculateConfidence(dim.before, dim.after, contribution);
        causes.push({
          dimension: dim.name,
          value: dim.value,
          contribution,
          confidence,
          explanation: this.generateExplanation(dim.name, dim.value, contribution, decline),
        });
      }
    }

    causes.sort((a, b) => b.contribution - a.contribution);
    return causes;
  }

  explainGrowth(totalBefore: number, totalAfter: number, dimensions: DimensionBreakdown[]): RootCause[] {
    if (totalBefore === totalAfter || totalBefore === 0) return [];

    const totalGrowth = totalAfter - totalBefore;
    if (totalGrowth <= 0) return [];

    const causes: RootCause[] = [];

    for (const dim of dimensions) {
      const growth = dim.after - dim.before;
      if (growth <= 0) continue;

      const contribution = growth / totalGrowth;
      if (contribution > 0.05) {
        const confidence = this.calculateConfidence(dim.before, dim.after, contribution);
        causes.push({
          dimension: dim.name,
          value: dim.value,
          contribution,
          confidence,
          explanation: this.generateGrowthExplanation(dim.name, dim.value, contribution, growth),
        });
      }
    }

    causes.sort((a, b) => b.contribution - a.contribution);
    return causes;
  }

  private calculateConfidence(before: number, after: number, contribution: number): number {
    if (before === 0) return 0.5;

    const changePercent = Math.abs((after - before) / before) * 100;
    const baseConfidence = Math.min(0.95, changePercent / 100);
    const contributionFactor = Math.min(1.0, contribution * 2);

    return (baseConfidence + contributionFactor) / 2;
  }

  private generateExplanation(dimension: string, value: string, contribution: number, decline: number): string {
    const percentContribution = contribution * 100;
    let percentDecline = (decline / Math.abs(decline)) * 100;
    if (Math.abs(percentDecline) > 100) percentDecline = 100;

    const verb = dimension === "channel" ? "decreased" : dimension === "product" ? "dropped" : "declined";
    return this.formatExplanation(value, dimension, percentContribution, percentDecline, verb);
  }

  private generateGrowthExplanation(dimension: string, value: string, contribution: number, growth: number): string {
    const percentContribution = contribution * 100;
    let percentGrowth = (growth / Math.abs(growth)) * 100;
    if (percentGrowth > 100) percentGrowth = 100;

    const verb = dimension === "channel" ? "increased" : dimension === "product" ? "rose" : "grew";
    return this.formatExplanation(value, dimension, percentContribution, percentGrowth, verb);
  }

  private formatExplanation(value: string, dimension: string, contribution: number, changePercent: number, verb: string): string {
    if (contribution > 30) {
      return `${value} ${dimension} is the main driver, ${verb}ing ${Math.abs(changePercent).toFixed(1)}% and contributing ${contribution.toFixed(0)}% of total change`;
    }
    return `${value} ${dimension} ${verb} by ${Math.abs(changePercent).toFixed(1)}%, contributing ${contribution.toFixed(0)}% of total change`;
  }
}
