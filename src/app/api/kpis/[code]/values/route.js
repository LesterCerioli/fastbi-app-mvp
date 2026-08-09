import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { sanitize } from "@/lib/sanitize";
import { KPIService } from "@/services/kpis/kpi_service";

const service = new KPIService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const organizationName = searchParams.get("organization_name");

    if (!organizationName) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const { kpi_id, org_id } = await service.ResolveKPIIDByCode(code, organizationName);
    const kpi = await service.GetKPIByID(kpi_id, org_id);

    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : 90;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset"), 10) : 0;

    const values = await service.GetKPIValues(kpi_id, org_id, limit, offset);
    const breakdown = await service.GetKPIValueBreakdown(kpi, org_id);

    return NextResponse.json(
      {
        code,
        kpi: sanitize(kpi),
        series: values,
        breakdown,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message === "KPI not found" || message.startsWith("organization")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}