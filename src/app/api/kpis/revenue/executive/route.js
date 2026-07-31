import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { KPIService } from "@/services/kpis/kpi_service";

const service = new KPIService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const organizationName = searchParams.get("organization_name");

    if (!organizationName) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const period = searchParams.get("period") || "monthly";

    const result = await service.GetExecutiveRevenueReport(organizationName, period);

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
