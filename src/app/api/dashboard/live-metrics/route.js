import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { ExecutiveAnalyticsService } from "@/services/ai/executive_analytics_service";
import { liveMetricsService } from "@/services/dashboard/live_metrics_service";

const executiveService = new ExecutiveAnalyticsService();

export async function GET(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized. call POST /api/session/init first" }, { status: 400 });
    }

    const summaryPromise = executiveService.getExecutiveSummary(organizationName).catch(() => null);

    const kpiValuesPromise = liveMetricsService.getKpiValues(organizationName).catch(() => []);

    const insightsPromise = liveMetricsService.getInsights(organizationName).catch(() => []);

    const [summary, kpiValuesResult, insightsResult] = await Promise.all([
      summaryPromise,
      kpiValuesPromise,
      insightsPromise,
    ]);

    const kpiRows = kpiValuesResult || [];
    const insights = insightsResult || [];

    const revenueKpi = kpiRows.find(r => r.code === "revenue" || r.name?.toLowerCase().includes("revenue"));
    const customersKpi = kpiRows.find(r => r.code === "customers" || r.name?.toLowerCase().includes("customer"));
    const ordersKpi = kpiRows.find(r => r.code === "orders" || r.name?.toLowerCase().includes("order") || r.name?.toLowerCase().includes("transaction"));

    const revPercent = summary?.currentPeriod?.onTrackPercent ?? (revenueKpi ? (revenueKpi.achieved_target ? 85 : 60) : null);
    const customersPercent = customersKpi && customersKpi.target_value > 0
      ? Math.min(100, Math.round((customersKpi.actual_value / customersKpi.target_value) * 100))
      : customersKpi ? (customersKpi.achieved_target ? 100 : 0) : null;
    const ordersPercent = ordersKpi && ordersKpi.target_value > 0
      ? Math.min(100, Math.round((ordersKpi.actual_value / ordersKpi.target_value) * 100))
      : ordersKpi ? (ordersKpi.achieved_target ? 100 : 0) : null;

    const alerts = insights.map(i => ({
      id: i.id,
      type: i.insight_type || "info",
      severity: i.severity || "info",
      title: i.title,
      description: i.description,
      confidence: i.confidence,
      created_at: i.created_at,
    }));

    return NextResponse.json({
      organization_name: organizationName,
      bars: {
        revenue_percent: revPercent,
        customers_percent: customersPercent,
        orders_percent: ordersPercent,
      },
      growth: {
        mom_growth: summary?.growthIndicators?.monthlyGrowth ?? null,
        daily_growth: summary?.growthIndicators?.dailyGrowth ?? null,
        vs_previous_percent: summary?.currentPeriod?.vsPreviousPercent ?? null,
      },
      executive_summary: summary,
      kpi_values: kpiRows.map(r => ({
        code: r.code,
        name: r.name,
        actual: r.actual_value,
        target: r.target_value,
        variance: r.variance_percentage,
        achieved: r.achieved_target,
      })),
      alerts,
    }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
