import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { DashboardService } from "@/services/dashboard/dashboard_service";

const service = new DashboardService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const organizationName = searchParams.get("organization_name");

    if (!organizationName) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const organizationID = await service.ResolveOrganizationID(organizationName);

    const filter = {
      is_active: searchParams.get("is_active") !== null ? searchParams.get("is_active") === "true" : null,
      business_context: searchParams.get("business_context") || null,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset"), 10) : undefined,
    };

    const [dashboards, total] = await service.ListDashboards(organizationID, filter);

    return NextResponse.json({ data: dashboards, total, organization_name: organizationName }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("organization not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.organization_name) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const dashboard = await service.CreateDashboard({
      organization_name: body.organization_name,
      name: body.name,
      description: body.description,
      template_id: body.template_name
        ? await service.ResolveTemplateIDByName(body.template_name)
        : null,
      dataset_ids: body.dataset_ids,
      layout: body.layout,
      business_context: body.business_context,
      refresh_rate: body.refresh_rate,
      is_public: body.is_public,
      is_default: body.is_default,
      created_by: body.created_by,
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("organization not found") || message.startsWith("dashboard template not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
