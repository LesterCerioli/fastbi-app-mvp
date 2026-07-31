import {
  getRunStatusDistribution,
  getStageBottlenecks,
  getDailyFailureRates,
  getDeliveryTimeTrend,
} from "./reportDynamoDBService";

export type { RunStatusCount, RunStatusDistributionResult, StageDurationRow, StageBottleneckResult, RunFailureRow, RunFailureRateResult, DeliveryTimeStat, DeliveryTimeTrendResult } from "./reportDynamoDBService";

export class ReportExecutionAnalyzerService {
  async getRunStatusDistribution(
    orgName: string
  ): Promise<import("./reportDynamoDBService").RunStatusDistributionResult> {
    return getRunStatusDistribution(orgName);
  }

  async getStageBottlenecks(
    orgName: string
  ): Promise<import("./reportDynamoDBService").StageBottleneckResult> {
    return getStageBottlenecks(orgName);
  }

  async getFailureRate(
    orgName: string,
    lookbackDays: number
  ): Promise<import("./reportDynamoDBService").RunFailureRateResult> {
    return getDailyFailureRates(orgName, lookbackDays);
  }

  async getDeliveryTimeTrend(
    orgName: string,
    lookbackDays: number
  ): Promise<import("./reportDynamoDBService").DeliveryTimeTrendResult> {
    return getDeliveryTimeTrend(orgName, lookbackDays);
  }
}
