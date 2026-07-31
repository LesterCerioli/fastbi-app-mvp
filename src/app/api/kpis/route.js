import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { sanitize } from "@/lib/sanitize";
import { KPIService } from "@/services/kpis/kpi_service";

const service = new KPIService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);

    const filter = {
      organization_name: searchParams.get("organization_name") || undefined,
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      code: searchParams.get("code") || undefined,
      name: searchParams.get("name") || undefined,
      reporting_period: searchParams.get("reporting_period") || undefined,
      applicable_region: searchParams.get("applicable_region") || undefined,
      alert_enabled: searchParams.has("alert_enabled")
        ? searchParams.get("alert_enabled") === "true"
        : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset"), 10) : undefined,
      order_by: searchParams.get("order_by") || undefined,
      order_dir: searchParams.get("order_dir") || undefined,
    };

    const [kpis, total] = await service.ListKPIs(filter);

    return NextResponse.json({ data: sanitize(kpis), total }, { status: 200 });
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

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.organization_name) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }
    if (!body.code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const kpi = await service.CreateKPI({
      organization_name: body.organization_name,
      code: body.code,
      name: body.name,
      description: body.description || "",
      category: body.category,
      unit: body.unit,
      aggregation: body.aggregation,
      target_value: body.target_value ?? null,
      target_min: body.target_min ?? null,
      target_max: body.target_max ?? null,
      comparison_operator: body.comparison_operator,
      alert_threshold: body.alert_threshold ?? null,
      alert_enabled: body.alert_enabled !== undefined ? body.alert_enabled : false,
      alert_severity: body.alert_severity || null,
      calculation_query: body.calculation_query,
      calculation_schema: body.calculation_schema || {},
      depends_on: body.depends_on || [],
      reporting_period: body.reporting_period,
      lookback_days: body.lookback_days || 30,
      applicable_regions: body.applicable_regions || [],
      applicable_departments: body.applicable_departments || [],
      applicable_business_units: body.applicable_business_units || [],
      required_roles: body.required_roles || [],
      view_permissions: body.view_permissions || {},
      created_by: body.created_by || null,
    });

    return NextResponse.json(sanitize(kpi), { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("organization") || message === "KPI not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
