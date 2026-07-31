import { query } from "../db";
import { AgentRepository } from "./repository";
import { Planner, type Goal, type CurrentMetrics } from "./planner";
import { Reasoner, type DetectedAnomaly, type RootCause } from "./reasoner";
import { Executor } from "./executor";
import { RAGEngine } from "./rag_engine";
import { AnomalyDetector } from "./anomaly_detector";
import { RootCauseAnalyzer } from "./root_cause_analyzer";
import { BehavioralMemory } from "./behavioral_memory";
import { RecommendationGenerator } from "./recommendation_generator";

export interface AgentRequest {
  organizationId: string;
  goal: Goal;
  parameters?: Record<string, any>;
  includeHistory?: boolean;
}

export interface Insight {
  type: string;
  severity: string;
  title: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface ExecutionStep {
  stepNumber: number;
  toolName: string;
  input: Record<string, any>;
  output: string;
  error: string;
  durationMs: number;
}

export interface AgentResponse {
  goal: Goal;
  insights: Insight[];
  recommendations: string[];
  anomalies: DetectedAnomaly[];
  rootCauses: RootCause[];
  similarPatterns: any[];
  confidence: number;
  executionSteps: ExecutionStep[];
  executedAt: Date;
}

export interface CategoryMetric {
  category: string;
  revenue: number;
}

export interface RegionMetric {
  region: string;
  revenue: number;
}

export class IntelligentAgentEngine {
  private repo: AgentRepository;
  private planner: Planner;
  private reasoner: Reasoner;
  private executor: Executor;
  private ragEngine: RAGEngine;
  private anomalyDetector: AnomalyDetector;
  private rootCauseAnalyzer: RootCauseAnalyzer;
  private behavioralMemory: BehavioralMemory;
  private recommendationGenerator: RecommendationGenerator;

  constructor() {
    this.repo = new AgentRepository();
    this.anomalyDetector = new AnomalyDetector();
    this.rootCauseAnalyzer = new RootCauseAnalyzer();
    this.behavioralMemory = new BehavioralMemory(this.repo);
    this.planner = new Planner();
    this.reasoner = new Reasoner();
    this.executor = new Executor(this.anomalyDetector, this.rootCauseAnalyzer, this.behavioralMemory);
    this.ragEngine = new RAGEngine();
    this.recommendationGenerator = new RecommendationGenerator();
  }

  async execute(req: AgentRequest): Promise<AgentResponse> {
    const startTime = new Date();

    const currentMetrics = await this.getCurrentMetrics(req.organizationId);

    const plan = this.planner.createPlan(req.goal, currentMetrics, req.parameters ?? {});

    const executionSteps: ExecutionStep[] = [];
    const allAnomalies: DetectedAnomaly[] = [];
    const allRootCauses: RootCause[] = [];

    for (let stepNum = 0; stepNum < plan.subGoals.length; stepNum++) {
      const subGoal = plan.subGoals[stepNum];
      const stepStart = Date.now();

      const score = this.reasoner.scoreAction(subGoal.toolName, currentMetrics, allAnomalies, allRootCauses);
      if (score < 0.3) continue;

      const params = this.buildParamsForTool(subGoal.toolName, req.parameters ?? {});
      const result = await this.executor.executeTool(subGoal.toolName, params, req.organizationId);

      const step: ExecutionStep = {
        stepNumber: stepNum + 1,
        toolName: subGoal.toolName,
        input: params,
        output: result.success ? JSON.stringify(result.output) : "",
        error: result.success ? "" : result.error,
        durationMs: Date.now() - stepStart,
      };

      if (result.success) {
        if (result.output && Array.isArray(result.output)) {
          for (const item of result.output) {
            if (item && typeof item.zScore === "number") {
              allAnomalies.push(item);
            }
            if (item && typeof item.contribution === "number") {
              allRootCauses.push(item);
            }
          }
        }
      }

      executionSteps.push(step);
    }

    let similarPatterns: any[] = [];
    if (req.includeHistory && currentMetrics) {
      const triggerMap: Record<string, any> = {
        goal: req.goal,
        growth_rate: currentMetrics.growthRate,
      };
      try {
        similarPatterns = await this.behavioralMemory.findSimilarPatterns(req.organizationId, triggerMap, 5);
      } catch {
        // ignore
      }
    }

    let ragContext = "";
    try {
      ragContext = await this.ragEngine.getRelevantKnowledge(req.organizationId, {
        goal: req.goal,
        growth_rate: currentMetrics?.growthRate,
      });
    } catch {
      // ignore
    }

    const recommendations = this.recommendationGenerator.generate(
      currentMetrics,
      allAnomalies,
      allRootCauses,
      similarPatterns
    );

    if (ragContext) {
      recommendations.push(`Historical context: ${ragContext}`);
    }

    const insights = this.generateInsightsFromAnalysis(currentMetrics, allAnomalies, allRootCauses);

    for (const insight of insights) {
      if (insight.confidence > 0.7) {
        await this.repo.saveInsight(
          req.organizationId,
          insight.type,
          insight.severity,
          insight.title,
          insight.description,
          insight.confidence,
          insight.metadata
        );
      }
    }

    for (const anomaly of allAnomalies) {
      if (anomaly.zScore > 2.5) {
        await this.repo.saveAnomaly(
          req.organizationId,
          anomaly.metric,
          anomaly.dimension,
          anomaly.dimensionValue,
          anomaly.expectedValue,
          anomaly.actualValue,
          anomaly.zScore
        );
      }
    }

    const confidence = this.calculateOverallConfidence(currentMetrics, allAnomalies, allRootCauses);

    return {
      goal: req.goal,
      insights,
      recommendations,
      anomalies: allAnomalies,
      rootCauses: allRootCauses,
      similarPatterns,
      confidence,
      executionSteps,
      executedAt: startTime,
    };
  }

  async scheduledAnalysis(organizationId: string): Promise<void> {
    const req: AgentRequest = {
      organizationId,
      goal: "monitor_anomalies",
      includeHistory: true,
    };

    const response = await this.execute(req);

    for (const insight of response.insights) {
      if (insight.severity === "critical" || insight.severity === "high") {
        await this.repo.saveInsight(
          organizationId,
          insight.type,
          insight.severity,
          insight.title,
          insight.description,
          insight.confidence,
          insight.metadata
        );
      }
    }
  }

  async getCurrentMetrics(organizationId: string): Promise<CurrentMetrics | null> {
    try {
      const r = await query(
        `SELECT
           COALESCE(SUM(amount), 0) as total_revenue,
           COUNT(*) as transaction_count,
           COALESCE(AVG(amount), 0) as avg_order_value
         FROM public.sales_records
         WHERE organization_id = $1 AND date >= NOW() - INTERVAL '30 days'`,
        [organizationId]
      );

      const metrics: CurrentMetrics = {
        totalRevenue: Number(r.rows[0].total_revenue),
        transactionCount: Number(r.rows[0].transaction_count),
        averageOrderValue: Number(r.rows[0].avg_order_value),
        growthRate: 0,
        periodLabel: "Last 30 days",
        topCategories: [],
        topRegions: [],
      };

      const growthR = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as current,
           COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as previous
         FROM public.sales_records
         WHERE organization_id = $1`,
        [organizationId]
      );

      const { current, previous } = growthR.rows[0];
      if (Number(previous) > 0) {
        metrics.growthRate = ((Number(current) - Number(previous)) / Number(previous)) * 100;
      }

      const catR = await query(
        `SELECT category, COALESCE(SUM(amount), 0) as revenue
         FROM public.sales_records
         WHERE organization_id = $1 AND category IS NOT NULL AND category != ''
           AND date >= NOW() - INTERVAL '30 days'
         GROUP BY category
         ORDER BY revenue DESC
         LIMIT 5`,
        [organizationId]
      );

      metrics.topCategories = catR.rows.map((row: any) => ({
        category: row.category,
        revenue: Number(row.revenue),
      }));

      const regionR = await query(
        `SELECT region, COALESCE(SUM(amount), 0) as revenue
         FROM public.sales_records
         WHERE organization_id = $1 AND region IS NOT NULL AND region != ''
           AND date >= NOW() - INTERVAL '30 days'
         GROUP BY region
         ORDER BY revenue DESC
         LIMIT 5`,
        [organizationId]
      );

      metrics.topRegions = regionR.rows.map((row: any) => ({
        region: row.region,
        revenue: Number(row.revenue),
      }));

      return metrics;
    } catch {
      return null;
    }
  }

  private buildParamsForTool(toolName: string, baseParams: Record<string, any>): Record<string, any> {
    const params = { ...baseParams };

    switch (toolName) {
      case "analyze_by_dimension":
        if (!params["dimension"]) params["dimension"] = "category";
        break;
      case "detect_anomalies":
        if (!params["threshold"]) params["threshold"] = 2.5;
        break;
      case "find_growing_dimensions":
        if (!params["dimension"]) params["dimension"] = "category";
        if (!params["limit"]) params["limit"] = 5;
        break;
      case "get_historical_data":
        if (!params["months"]) params["months"] = 12;
        break;
    }

    return params;
  }

  private generateInsightsFromAnalysis(
    metrics: CurrentMetrics | null,
    anomalies: DetectedAnomaly[],
    rootCauses: RootCause[]
  ): Insight[] {
    const insights: Insight[] = [];

    if (metrics) {
      if (metrics.growthRate > 10) {
        insights.push({
          type: "trend",
          severity: "positive",
          title: "Strong Growth Momentum",
          description: `Revenue grew ${metrics.growthRate.toFixed(1)}% in the last 30 days, significantly above average`,
          confidence: 0.85,
          metadata: { growth_rate: metrics.growthRate },
        });
      } else if (metrics.growthRate < -10) {
        insights.push({
          type: "alert",
          severity: "critical",
          title: "Significant Revenue Decline",
          description: `Revenue declined ${Math.abs(metrics.growthRate).toFixed(1)}% in the last 30 days - immediate attention required`,
          confidence: 0.9,
          metadata: { decline_rate: metrics.growthRate },
        });
      }
    }

    for (const a of anomalies) {
      if (a.zScore > 3) {
        const severity = a.actualValue < a.expectedValue ? "critical" : "high";
        insights.push({
          type: "anomaly",
          severity,
          title: `Unusual Pattern in ${a.metric}`,
          description: `Detected ${a.zScore.toFixed(1)} sigma deviation - actual ${a.actualValue.toFixed(2)} vs expected ${a.expectedValue.toFixed(2)}`,
          confidence: 0.75,
          metadata: { zscore: a.zScore, metric: a.metric },
        });
      }
    }

    for (const rc of rootCauses) {
      if (rc.contribution > 0.4) {
        insights.push({
          type: "root_cause",
          severity: "medium",
          title: `Primary Driver: ${rc.value} ${rc.dimension}`,
          description: rc.explanation,
          confidence: rc.confidence,
          metadata: { contribution: rc.contribution, dimension: rc.dimension },
        });
      }
    }

    return insights;
  }

  private calculateOverallConfidence(
    metrics: CurrentMetrics | null,
    anomalies: DetectedAnomaly[],
    _rootCauses: RootCause[]
  ): number {
    let confidence = 0.7;

    if (metrics && metrics.transactionCount < 50) confidence -= 0.2;
    if (metrics && metrics.totalRevenue === 0) confidence -= 0.3;
    if (anomalies.length > 0) confidence -= 0.1;

    return Math.max(0.3, Math.min(0.95, confidence));
  }
}
