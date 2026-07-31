import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { DashboardService } from "@/services/dashboard/dashboard_service";

const service = new DashboardService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { slug } = await params;
    const { id: dashboardID, organization_id } = await service.ResolveDashboardBySlug(slug);
    const widgets = await service.ListWidgets(dashboardID, organization_id);

    return NextResponse.json({ data: widgets }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message === "dashboard not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request, { params }) {
  try {
    await authenticate(request);

    const { slug } = await params;
    const { id: dashboardID, organization_id } = await service.ResolveDashboardBySlug(slug);
    const body = await request.json().catch(() => ({}));

    if (!body.widget_type) {
      return NextResponse.json({ error: "widget_type is required" }, { status: 400 });
    }

    const widget = await service.AddWidget(dashboardID, organization_id, {
      organization_name: body.organization_name,
      widget_type: body.widget_type,
      title: body.title,
      description: body.description,
      kpi_id: body.kpi_id,
      config: body.config,
      position: body.position,
      size: body.size,
      refresh_interval: body.refresh_interval,
      sort_order: body.sort_order,
      created_by: body.created_by,
    });

    return NextResponse.json(widget, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message === "dashboard not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
