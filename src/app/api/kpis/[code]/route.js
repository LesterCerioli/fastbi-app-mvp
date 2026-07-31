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

    return NextResponse.json(sanitize(kpi), { status: 200 });
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

export async function PUT(request, { params }) {
  try {
    await authenticate(request);

    const { code } = await params;
    const body = await request.json().catch(() => ({}));

    if (!body.organization_name) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const { kpi_id, org_id } = await service.ResolveKPIIDByCode(code, body.organization_name);

    const kpi = await service.UpdateKPI(kpi_id, org_id, {
      organization_name: body.organization_name,
      name: body.name ?? null,
      description: body.description ?? null,
      category: body.category ?? null,
      unit: body.unit ?? null,
      aggregation: body.aggregation ?? null,
      target_value: body.target_value ?? null,
      target_min: body.target_min ?? null,
      target_max: body.target_max ?? null,
      comparison_operator: body.comparison_operator ?? null,
      alert_threshold: body.alert_threshold ?? null,
      alert_enabled: body.alert_enabled ?? null,
      alert_severity: body.alert_severity ?? null,
      calculation_query: body.calculation_query ?? null,
      calculation_schema: body.calculation_schema,
      depends_on: body.depends_on,
      reporting_period: body.reporting_period ?? null,
      lookback_days: body.lookback_days ?? null,
      applicable_regions: body.applicable_regions,
      applicable_departments: body.applicable_departments,
      applicable_business_units: body.applicable_business_units,
      required_roles: body.required_roles,
      view_permissions: body.view_permissions,
      status: body.status ?? null,
      updated_by: body.updated_by ?? null,
      change_reason: body.change_reason || null,
    });

    return NextResponse.json(sanitize(kpi), { status: 200 });
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

export async function DELETE(request, { params }) {
  try {
    await authenticate(request);

    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const organizationName = searchParams.get("organization_name");

    if (!organizationName) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const { kpi_id, org_id } = await service.ResolveKPIIDByCode(code, organizationName);
    await service.DeleteKPI(kpi_id, org_id, searchParams.get("deleted_by"), searchParams.get("reason"));

    return NextResponse.json({ message: "KPI deleted", code }, { status: 200 });
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
