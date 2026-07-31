import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { DashboardService } from "@/services/dashboard/dashboard_service";

const service = new DashboardService();

export async function PUT(request, { params }) {
  try {
    await authenticate(request);

    const { slug, widget_title } = await params;
    const { id: dashboardID, organization_id } = await service.ResolveDashboardBySlug(slug);
    const widgetID = await service.ResolveWidgetIDByTitle(dashboardID, widget_title);
    const body = await request.json().catch(() => ({}));

    const widget = await service.UpdateWidget(widgetID, dashboardID, organization_id, {
      widget_type: body.widget_type,
      title: body.title,
      description: body.description,
      kpi_id: body.kpi_id,
      config: body.config,
      position: body.position,
      size: body.size,
      refresh_interval: body.refresh_interval,
      is_visible: body.is_visible,
      sort_order: body.sort_order,
      updated_by: body.updated_by,
    });

    return NextResponse.json(widget, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message === "dashboard not found" || message === "widget not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("ambiguous")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await authenticate(request);

    const { slug, widget_title } = await params;
    const { id: dashboardID, organization_id } = await service.ResolveDashboardBySlug(slug);
    const widgetID = await service.ResolveWidgetIDByTitle(dashboardID, widget_title);
    await service.DeleteWidget(widgetID, dashboardID, organization_id);

    return NextResponse.json({ message: "Widget deleted", slug, widget_title }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message === "dashboard not found" || message === "widget not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("ambiguous")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
