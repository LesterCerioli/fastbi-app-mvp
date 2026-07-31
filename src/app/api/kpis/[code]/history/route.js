import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
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

    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset"), 10) : 0;

    const [history, total] = await service.GetKPIHistory(kpi_id, org_id, limit, offset);

    return NextResponse.json({ data: history, total, code }, { status: 200 });
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
