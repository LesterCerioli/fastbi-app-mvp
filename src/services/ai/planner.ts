export type Goal =
  | "diagnose_decline"
  | "find_opportunities"
  | "forecast"
  | "compare_periods"
  | "generate_insights"
  | "monitor_anomalies";

export interface SubGoal {
  id: string;
  description: string;
  toolName: string;
  priority: number;
  dependsOn: string[];
}

export interface Plan {
  goal: Goal;
  subGoals: SubGoal[];
  requiredTools: string[];
  estimatedSteps: number;
}

export interface CurrentMetrics {
  totalRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  growthRate: number;
  periodLabel: string;
  topCategories: { category: string; revenue: number }[];
  topRegions: { region: string; revenue: number }[];
}

export class Planner {
  createPlan(goal: Goal, currentMetrics: CurrentMetrics | null, parameters: Record<string, any>): Plan {
    switch (goal) {
      case "diagnose_decline":
        return this.createDeclinePlan(currentMetrics, parameters);
      case "find_opportunities":
        return this.createOpportunityPlan(currentMetrics, parameters);
      case "forecast":
        return this.createForecastPlan(currentMetrics, parameters);
      case "compare_periods":
        return this.createComparePlan(currentMetrics, parameters);
      case "generate_insights":
        return this.createInsightsPlan(currentMetrics, parameters);
      case "monitor_anomalies":
        return this.createMonitorPlan(currentMetrics, parameters);
      default:
        return this.createGeneralPlan(currentMetrics, parameters);
    }
  }

  private createDeclinePlan(_metrics: CurrentMetrics | null, _params: Record<string, any>): Plan {
    const subGoals: SubGoal[] = [
      { id: "step1", description: "Calculate overall decline percentage", toolName: "calculate_growth", priority: 1, dependsOn: [] },
      { id: "step2", description: "Analyze decline by category", toolName: "analyze_by_dimension", priority: 2, dependsOn: ["step1"] },
      { id: "step3", description: "Analyze decline by region", toolName: "analyze_by_dimension", priority: 2, dependsOn: ["step1"] },
      { id: "step4", description: "Find root causes", toolName: "root_cause_analysis", priority: 3, dependsOn: ["step2", "step3"] },
      { id: "step5", description: "Find similar historical patterns", toolName: "find_similar_patterns", priority: 4, dependsOn: ["step4"] },
      { id: "step6", description: "Generate recommendations", toolName: "generate_recommendations", priority: 5, dependsOn: ["step4", "step5"] },
    ];

    return {
      goal: "diagnose_decline",
      subGoals,
      requiredTools: ["calculate_growth", "analyze_by_dimension", "root_cause_analysis", "find_similar_patterns", "generate_recommendations"],
      estimatedSteps: 6,
    };
  }

  private createOpportunityPlan(_metrics: CurrentMetrics | null, _params: Record<string, any>): Plan {
    const subGoals: SubGoal[] = [
      { id: "step1", description: "Identify fastest growing categories", toolName: "find_growing_dimensions", priority: 1, dependsOn: [] },
      { id: "step2", description: "Identify best performing channels", toolName: "analyze_by_dimension", priority: 1, dependsOn: [] },
      { id: "step3", description: "Check seasonal patterns for peaks", toolName: "seasonality_analysis", priority: 2, dependsOn: [] },
      { id: "step4", description: "Find successful historical patterns", toolName: "find_similar_patterns", priority: 3, dependsOn: ["step1", "step2", "step3"] },
      { id: "step5", description: "Generate opportunity recommendations", toolName: "generate_opportunities", priority: 4, dependsOn: ["step4"] },
    ];

    return {
      goal: "find_opportunities",
      subGoals,
      requiredTools: ["find_growing_dimensions", "analyze_by_dimension", "seasonality_analysis", "find_similar_patterns", "generate_opportunities"],
      estimatedSteps: 5,
    };
  }

  private createForecastPlan(_metrics: CurrentMetrics | null, params: Record<string, any>): Plan {
    const periods = typeof params["periods_ahead"] === "number" ? params["periods_ahead"] : 3;

    const subGoals: SubGoal[] = [
      { id: "step1", description: "Collect historical sales data", toolName: "get_historical_data", priority: 1, dependsOn: [] },
      { id: "step2", description: "Train prediction model", toolName: "train_forecast_model", priority: 2, dependsOn: ["step1"] },
      { id: "step3", description: "Generate forecast", toolName: "predict_future", priority: 3, dependsOn: ["step2"] },
      { id: "step4", description: "Calculate confidence intervals", toolName: "calculate_confidence", priority: 4, dependsOn: ["step3"] },
    ];

    void periods;

    return {
      goal: "forecast",
      subGoals,
      requiredTools: ["get_historical_data", "train_forecast_model", "predict_future", "calculate_confidence"],
      estimatedSteps: 4,
    };
  }

  private createComparePlan(_metrics: CurrentMetrics | null, _params: Record<string, any>): Plan {
    const subGoals: SubGoal[] = [
      { id: "step1", description: "Get period 1 metrics", toolName: "get_period_metrics", priority: 1, dependsOn: [] },
      { id: "step2", description: "Get period 2 metrics", toolName: "get_period_metrics", priority: 1, dependsOn: [] },
      { id: "step3", description: "Calculate differences", toolName: "compare_metrics", priority: 2, dependsOn: ["step1", "step2"] },
      { id: "step4", description: "Analyze by dimension", toolName: "analyze_by_dimension", priority: 3, dependsOn: ["step3"] },
      { id: "step5", description: "Generate comparison insights", toolName: "generate_insights", priority: 4, dependsOn: ["step4"] },
    ];

    return {
      goal: "compare_periods",
      subGoals,
      requiredTools: ["get_period_metrics", "compare_metrics", "analyze_by_dimension", "generate_insights"],
      estimatedSteps: 5,
    };
  }

  private createInsightsPlan(_metrics: CurrentMetrics | null, _params: Record<string, any>): Plan {
    const subGoals: SubGoal[] = [
      { id: "step1", description: "Get current metrics", toolName: "get_current_metrics", priority: 1, dependsOn: [] },
      { id: "step2", description: "Detect anomalies", toolName: "detect_anomalies", priority: 2, dependsOn: ["step1"] },
      { id: "step3", description: "Find opportunities", toolName: "find_opportunities", priority: 2, dependsOn: ["step1"] },
      { id: "step4", description: "Generate insights summary", toolName: "summarize_insights", priority: 3, dependsOn: ["step2", "step3"] },
    ];

    return {
      goal: "generate_insights",
      subGoals,
      requiredTools: ["get_current_metrics", "detect_anomalies", "find_opportunities", "summarize_insights"],
      estimatedSteps: 4,
    };
  }

  private createMonitorPlan(_metrics: CurrentMetrics | null, _params: Record<string, any>): Plan {
    const subGoals: SubGoal[] = [
      { id: "step1", description: "Get recent metrics", toolName: "get_current_metrics", priority: 1, dependsOn: [] },
      { id: "step2", description: "Detect anomalies in all dimensions", toolName: "detect_multi_dimension_anomalies", priority: 2, dependsOn: ["step1"] },
      { id: "step3", description: "Check trend changes", toolName: "detect_trend_change", priority: 2, dependsOn: ["step1"] },
      { id: "step4", description: "Generate alerts for critical issues", toolName: "generate_alerts", priority: 3, dependsOn: ["step2", "step3"] },
    ];

    return {
      goal: "monitor_anomalies",
      subGoals,
      requiredTools: ["get_current_metrics", "detect_multi_dimension_anomalies", "detect_trend_change", "generate_alerts"],
      estimatedSteps: 4,
    };
  }

  private createGeneralPlan(_metrics: CurrentMetrics | null, _params: Record<string, any>): Plan {
    const subGoals: SubGoal[] = [
      { id: "step1", description: "Get comprehensive metrics", toolName: "get_full_metrics", priority: 1, dependsOn: [] },
      { id: "step2", description: "Generate overall insights", toolName: "generate_full_insights", priority: 2, dependsOn: ["step1"] },
    ];

    return {
      goal: "generate_insights",
      subGoals,
      requiredTools: ["get_full_metrics", "generate_full_insights"],
      estimatedSteps: 2,
    };
  }
}
