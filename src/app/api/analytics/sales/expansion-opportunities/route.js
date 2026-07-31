import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { SalesAnalyticsService } from "@/services/sales/sales_analytics_service";

const service = new SalesAnalyticsService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const organizationName = searchParams.get("organization_name");

    if (!organizationName) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const minRevenueThreshold = parseFloat(searchParams.get("min_revenue_threshold") || "5000");

    const result = await service.getExpansionOpportunities(
      organizationName,
      minRevenueThreshold,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("organization")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
