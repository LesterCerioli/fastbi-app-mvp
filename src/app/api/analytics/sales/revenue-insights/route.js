import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { sanitize } from "@/lib/sanitize";
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

    const result = await service.getRevenueInsights(
      organizationName,
      searchParams.get("start_date") || undefined,
      searchParams.get("end_date") || undefined,
      searchParams.get("category") || undefined,
      searchParams.get("region") || undefined,
    );

    return NextResponse.json(sanitize(result), { status: 200 });
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
