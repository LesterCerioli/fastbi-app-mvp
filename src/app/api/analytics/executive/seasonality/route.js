import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { ExecutiveAnalyticsService } from "@/services/ai/executive_analytics_service";

const service = new ExecutiveAnalyticsService();

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.organization_name) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const result = await service.compareSeasonality(
      body.organization_name,
      body.granularity,
      body.compare_years,
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
