import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { SalesAnalyticsService } from "@/services/sales/sales_analytics_service";
import { ExecutiveAnalyticsService } from "@/services/ai/executive_analytics_service";
import { KPIService } from "@/services/kpis/kpi_service";

const salesService = new SalesAnalyticsService();
const executiveService = new ExecutiveAnalyticsService();
const kpiService = new KPIService();

export async function GET(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized. call POST /api/session/init first" }, { status: 400 });
    }

    const [
      revenueData,
      executiveSummary,
      kpiRevenue,
      forecastData,
      productMixData,
    ] = await Promise.allSettled([
      salesService.getRevenueInsights(organizationName),
      executiveService.getExecutiveSummary(organizationName),
      kpiService.GetExecutiveRevenueReport(organizationName, "monthly"),
      salesService.forecastRevenue(organizationName, 12),
      salesService.optimizeProductMix(organizationName),
    ]);

    const overview = {
      organization_name: organizationName,
      revenue: revenueData.status === "fulfilled" ? revenueData.value.key_metrics?.total_revenue ?? null : null,
      total_transactions: revenueData.status === "fulfilled" ? revenueData.value.key_metrics?.total_transactions ?? null : null,
      growth: executiveSummary.status === "fulfilled" ? executiveSummary.value.currentPeriod?.vsPreviousPercent ?? null : null,
      customers: kpiRevenue.status === "fulfilled" ? kpiRevenue.value.customer_count ?? null : null,
      details: {
        revenue: revenueData.status === "fulfilled" ? revenueData.value : null,
        executive_summary: executiveSummary.status === "fulfilled" ? executiveSummary.value : null,
        kpi_revenue: kpiRevenue.status === "fulfilled" ? kpiRevenue.value : null,
        forecast: forecastData.status === "fulfilled" ? forecastData.value : null,
        product_mix: productMixData.status === "fulfilled" ? productMixData.value : null,
      },
    };

    return NextResponse.json(overview, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}