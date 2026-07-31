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

    const monthsAhead = parseInt(searchParams.get("months_ahead") || "3", 10);
    const includeExternalFactors = searchParams.get("include_external_factors") === "true" || undefined;

    const result = await service.forecastRevenue(
      organizationName,
      monthsAhead,
      includeExternalFactors,
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
