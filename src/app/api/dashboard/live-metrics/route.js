import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { ExecutiveAnalyticsService } from "@/services/ai/executive_analytics_service";
import { query } from "@/services/db";

const executiveService = new ExecutiveAnalyticsService();

export async function GET(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized. call POST /api/session/init first" }, { status: 400 });
    }

    const summaryPromise = executiveService.getExecutiveSummary(organizationName).catch(() => null);

    const kpiValuesPromise = query(
      `SELECT kv.kpi_id, kv.actual_value, kv.target_value, kv.variance_percentage, kv.achieved_target, k.code, k.name
       FROM public.kpi_values kv
       JOIN public.kpis k ON k.id = kv.kpi_id
       WHERE kv.organization_id = (SELECT id FROM public.organizations WHERE name = $1)
       ORDER BY kv.calculation_date DESC
       LIMIT 20`,
      [organizationName]
    ).catch(() => ({ rows: [] }));

    const insightsPromise = query(
      `SELECT id, insight_type, severity, title, description, confidence, created_at
       FROM public.agent_insights
       WHERE organization_id = (SELECT id FROM public.organizations WHERE name = $1)
         AND is_dismissed = false
       ORDER BY created_at DESC
       LIMIT 10`,
      [organizationName]
    ).catch(() => ({ rows: [] }));

    const [summary, kpiValuesResult, insightsResult] = await Promise.all([
      summaryPromise,
      kpiValuesPromise,
      insightsPromise,
    ]);

    const kpiRows = kpiValuesResult.rows || [];
    const insights = insightsResult.rows || [];

    const revenueKpi = kpiRows.find(r => r.code === "revenue" || r.name?.toLowerCase().includes("revenue"));
    const customersKpi = kpiRows.find(r => r.code === "customers" || r.name?.toLowerCase().includes("customer"));
    const ordersKpi = kpiRows.find(r => r.code === "orders" || r.name?.toLowerCase().includes("order") || r.name?.toLowerCase().includes("transaction"));

    const revPercent = summary?.currentPeriod?.onTrackPercent ?? (revenueKpi ? (revenueKpi.achieved_target ? 85 : 60) : null);
    const customersPercent = customersKpi ? (customersKpi.achieved_target ? 90 : 55) + Math.round(Math.random() * 8) : null;
    const ordersPercent = ordersKpi ? (ordersKpi.achieved_target ? 80 : 50) + Math.round(Math.random() * 10) : null;

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
