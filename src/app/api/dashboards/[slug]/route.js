import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { DashboardService } from "@/services/dashboard/dashboard_service";

const service = new DashboardService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { slug } = await params;
    const { id, organization_id } = await service.ResolveDashboardBySlug(slug);
    const dashboard = await service.GetDashboardByID(id, organization_id);

    return NextResponse.json(dashboard, { status: 200 });
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

export async function PUT(request, { params }) {
  try {
    await authenticate(request);

    const { slug } = await params;
    const { id, organization_id } = await service.ResolveDashboardBySlug(slug);
    const body = await request.json().catch(() => ({}));

    const dashboard = await service.UpdateDashboard(id, organization_id, {
      name: body.name,
      description: body.description,
      dataset_ids: body.dataset_ids,
      layout: body.layout,
      business_context: body.business_context,
      refresh_rate: body.refresh_rate,
      is_public: body.is_public,
      is_default: body.is_default,
      is_active: body.is_active,
      updated_by: body.updated_by,
    });

    return NextResponse.json(dashboard, { status: 200 });
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

export async function DELETE(request, { params }) {
  try {
    await authenticate(request);

    const { slug } = await params;
    const { id, organization_id } = await service.ResolveDashboardBySlug(slug);
    await service.DeleteDashboard(id, organization_id);

    return NextResponse.json({ message: "Dashboard deleted", slug }, { status: 200 });
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
