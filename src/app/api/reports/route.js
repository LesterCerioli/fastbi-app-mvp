import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { ReportExecutionAnalyzerService } from "@/services/reports/report_execution_analyzer_service";
import { getReportActivityMetrics } from "@/services/reports/reportDynamoDBService";

const analyzerService = new ReportExecutionAnalyzerService();

export async function GET(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json(
        { error: "session not initialized. call POST /api/session/init first" },
        { status: 400 }
      );
    }

    const [
      statusDistribution,
      failureRates,
      bottleneckAnalysis,
      deliveryTrend,
      activityMetrics,
    ] = await Promise.all([
      analyzerService.getRunStatusDistribution(organizationName),
      analyzerService.getFailureRate(organizationName, 30),
      analyzerService.getStageBottlenecks(organizationName),
      analyzerService.getDeliveryTimeTrend(organizationName, 30),
      getReportActivityMetrics(organizationName),
    ]);

    const overview = {
      organizationName,
      statusDistribution,
      failureRates,
      bottleneckAnalysis,
      deliveryTrend,
      activityMetrics,
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