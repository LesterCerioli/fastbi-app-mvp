import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT || process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "t-100",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "amadeus74367908",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const REPORT_RUNS_TABLE = process.env.DYNAMODB_REPORT_RUNS_TABLE || "FastBI_report_runs";
const REPORT_RUN_STAGES_TABLE = process.env.DYNAMODB_REPORT_RUN_STAGES_TABLE || "FastBI_report_run_stages";
const REPORT_TEMPLATES_TABLE = process.env.DYNAMODB_REPORT_TEMPLATES_TABLE || "FastBI_report_templates";
const REPORT_TEMPLATE_CATALOG_TABLE = process.env.DYNAMODB_REPORT_TEMPLATE_CATALOG_TABLE || "FastBI_report_template_catalog";
const REPORT_TEMPLATE_PREVIEWS_TABLE = process.env.DYNAMODB_REPORT_TEMPLATE_PREVIEWS_TABLE || "FastBI_report_template_previews";
const REPORT_JOBS_TABLE = process.env.DYNAMODB_REPORT_JOBS_TABLE || "FastBI_report_jobs";
const REPORT_SCHEDULES_TABLE = process.env.DYNAMODB_REPORT_SCHEDULES_TABLE || "FastBI_report_schedules";

export interface RunStatusCount {
  status: string;
  count: number;
}

export interface RunStatusDistributionResult {
  organizationName: string;
  statusCounts: RunStatusCount[];
  totalRuns: number;
  failureRatePct: number;
  successRatePct: number;
}

export interface StageDurationRow {
  stage: string;
  avgDurationMs: number;
  maxDurationMs: number;
  sampleCount: number;
  isBottleneck: boolean;
}

export interface StageBottleneckResult {
  organizationName: string;
  stages: StageDurationRow[];
  bottleneckStage: string;
}

export interface RunFailureRow {
  date: string;
  totalRuns: number;
  failedRuns: number;
  failureRatePct: number;
}

export interface RunFailureRateResult {
  organizationName: string;
  lookbackDays: number;
  daily: RunFailureRow[];
  overallFailureRatePct: number;
  totalFailed: number;
  totalRuns: number;
}

export interface DeliveryTimeStat {
  avgDeliveryMin: number;
  minDeliveryMin: number;
  maxDeliveryMin: number;
  sampleCount: number;
  trend: string;
}

export interface DeliveryTimeTrendResult {
  organizationName: string;
  lookbackDays: number;
  recentPeriod: DeliveryTimeStat;
  previousPeriod: DeliveryTimeStat;
  trendDirection: string;
}

export interface ReportActivityMetrics {
  organizationName: string;
  totalRuns: number;
  totalTemplates: number;
  totalJobs: number;
  totalSchedules: number;
  activeSchedules: number;
  totalViews: number;
  successRatePct: number;
}

export async function getRunStatusDistribution(
  organizationName: string
): Promise<RunStatusDistributionResult> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: REPORT_RUNS_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );

  const items = result.Items || [];
  const statusCounts: Record<string, number> = {};
  let totalFailed = 0;
  let totalRuns = items.length;

  for (const item of items) {
    const status = (item as Record<string, unknown>).status as string;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (status === "failed" || status === "dead_lettered") totalFailed++;
  }

  const statusCountsArray: RunStatusCount[] = Object.entries(statusCounts).map(
    ([status, count]) => ({ status, count })
  );
  statusCountsArray.sort((a, b) => b.count - a.count);

  const failureRatePct = totalRuns > 0 ? Math.round((totalFailed / totalRuns) * 100) : 0;
  const successRatePct = totalRuns > 0 ? Math.round(((totalRuns - totalFailed) / totalRuns) * 100) : 100;

  return {
    organizationName,
    statusCounts: statusCountsArray,
    totalRuns,
    failureRatePct,
    successRatePct,
  };
}

export async function getDailyFailureRates(
  organizationName: string,
  lookbackDays: number = 30
): Promise<RunFailureRateResult> {
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_RUNS_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );

  const items = scanResult.Items || [];
  const daily: RunFailureRow[] = [];
  let totalFailed = 0;
  let totalRuns = 0;

  for (let i = lookbackDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    let dayRuns = 0;
    let dayFailed = 0;

    for (const item of items) {
      const createdAt = (item as Record<string, unknown>).createdAt as string;
      if (createdAt && createdAt.startsWith(dateStr)) {
        dayRuns++;
        const status = (item as Record<string, unknown>).status as string;
        if (status === "failed" || status === "dead_lettered") dayFailed++;
      }
    }

    if (dayRuns > 0) {
      daily.push({
        date: dateStr,
        totalRuns: dayRuns,
        failedRuns: dayFailed,
        failureRatePct: Math.round((dayFailed / dayRuns) * 100),
      });
      totalRuns += dayRuns;
      totalFailed += dayFailed;
    }
  }

  const overallFailureRatePct = totalRuns > 0 ? Math.round((totalFailed / totalRuns) * 100) : 0;

  return {
    organizationName,
    lookbackDays,
    daily,
    overallFailureRatePct,
    totalFailed,
    totalRuns,
  };
}

export async function getStageBottlenecks(
  organizationName: string
): Promise<StageBottleneckResult> {
  const runsResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_RUNS_TABLE,
      FilterExpression: "organizationName = :org AND currentStage <> :done",
      ExpressionAttributeValues: { ":org": organizationName, ":done": "completed" },
    })
  );

  const runs = runsResult.Items || [];
  const stageDurations: Record<string, number[]> = {};
  const stageCounts: Record<string, number> = {};

  for (const run of runs) {
    const stagesResult = await docClient.send(
      new ScanCommand({
        TableName: REPORT_RUN_STAGES_TABLE,
        FilterExpression: "runId = :runId",
        ExpressionAttributeValues: { ":runId": (run as Record<string, unknown>).id },
      })
    );
    const stages = stagesResult.Items || [];
    for (const stage of stages) {
      const stageName = (stage as Record<string, unknown>).currentStage as string || "unknown";
      const duration = (stage as Record<string, unknown>).durationMs as number || 0;
      if (!stageDurations[stageName]) {
        stageDurations[stageName] = [];
        stageCounts[stageName] = 0;
      }
      stageDurations[stageName].push(duration);
      stageCounts[stageName]++;
    }
  }

  const stages: StageDurationRow[] = Object.entries(stageDurations).map(([stage, durations]) => {
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const max = Math.max(...durations);
    return {
      stage,
      avgDurationMs: avg,
      maxDurationMs: max,
      sampleCount: durations.length,
      isBottleneck: avg > 5000,
    };
  });

  stages.sort((a, b) => b.avgDurationMs - a.avgDurationMs);
  const bottleneckStage = stages.length > 0 ? stages[0].stage : "none";

  return {
    organizationName,
    stages,
    bottleneckStage,
  };
}

export async function getDeliveryTimeTrend(
  organizationName: string,
  lookbackDays: number = 30
): Promise<DeliveryTimeTrendResult> {
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_RUNS_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );

  const items = scanResult.Items || [];
  const half = Math.floor(lookbackDays / 2);
  const now = new Date();
  const midDate = new Date(now.getTime() - half * 24 * 60 * 60 * 1000);

  let recentSum = 0;
  let recentCount = 0;
  let previousSum = 0;
  let previousCount = 0;

  for (const item of items) {
    const createdAt = (item as Record<string, unknown>).createdAt as string;
    if (!createdAt) continue;
    const createdDate = new Date(createdAt);
    const durationMs = (item as Record<string, unknown>).durationMs as number || 0;

    if (createdDate >= midDate) {
      recentSum += durationMs;
      recentCount++;
    } else {
      previousSum += durationMs;
      previousCount++;
    }
  }

  const recentAvg = recentCount > 0 ? recentSum / recentCount : 0;
  const previousAvg = previousCount > 0 ? previousSum / previousCount : 0;
  let trendDirection = "stable";
  if (previousCount > 0 && recentCount > 0) {
    const diff = recentAvg - previousAvg;
    if (diff > previousAvg * 0.05) trendDirection = "degrading";
    else if (diff < -previousAvg * 0.05) trendDirection = "improving";
  }

  return {
    organizationName,
    lookbackDays,
    recentPeriod: {
      avgDeliveryMin: Math.round(recentAvg / 60000),
      minDeliveryMin: 0,
      maxDeliveryMin: Math.round(recentAvg / 60000),
      sampleCount: recentCount,
      trend: trendDirection,
    },
    previousPeriod: {
      avgDeliveryMin: Math.round(previousAvg / 60000),
      minDeliveryMin: 0,
      maxDeliveryMin: Math.round(previousAvg / 60000),
      sampleCount: previousCount,
      trend: "stable",
    },
    trendDirection,
  };
}

export async function getReportActivityMetrics(
  organizationName: string
): Promise<ReportActivityMetrics> {
  const runsResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_RUNS_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );
  const runs = runsResult.Items || [];

  const templatesResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_TEMPLATES_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );
  const templates = templatesResult.Items || [];

  const jobsResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_JOBS_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );
  const jobs = jobsResult.Items || [];

  const schedulesResult = await docClient.send(
    new ScanCommand({
      TableName: REPORT_SCHEDULES_TABLE,
      FilterExpression: "organizationName = :org",
      ExpressionAttributeValues: { ":org": organizationName },
    })
  );
  const schedules = schedulesResult.Items || [];

  const activeSchedules = schedules.filter(
    (s: Record<string, unknown>) => (s.isActive as boolean) !== false
  ).length;

  const totalRuns = runs.length;
  const totalTemplates = templates.length;
  const totalJobs = jobs.length;
  const totalSchedules = schedules.length;

  const successfulRuns = runs.filter(
    (r: Record<string, unknown>) => (r.status as string) === "completed"
  ).length;
  const successRatePct = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

  return {
    organizationName,
    totalRuns,
    totalTemplates,
    totalJobs,
    totalSchedules,
    activeSchedules,
    totalViews: 0,
    successRatePct,
  };
}
