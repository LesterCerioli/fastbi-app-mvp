import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { DashboardService } from "@/services/dashboard/dashboard_service";

const service = new DashboardService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const id = await service.ResolveTemplateIDByName(name);
    const template = await service.GetTemplateByID(id);

    return NextResponse.json(template, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("dashboard template not found") || message.startsWith("template")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const id = await service.ResolveTemplateIDByName(name);
    const body = await request.json().catch(() => ({}));

    const template = await service.UpdateTemplate(id, {
      name: body.name,
      description: body.description,
      category: body.category,
      layout: body.layout,
      widgets: body.widgets,
      tags: body.tags,
      thumbnail_url: body.thumbnail_url,
      is_active: body.is_active,
      updated_by: body.updated_by,
    });

    return NextResponse.json(template, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("dashboard template not found") || message.startsWith("template")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const id = await service.ResolveTemplateIDByName(name);
    await service.DeleteTemplate(id);

    return NextResponse.json({ message: "Template deactivated", name }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("dashboard template not found") || message.startsWith("template")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("ambiguous")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
