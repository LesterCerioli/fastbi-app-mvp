import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { DashboardService } from "@/services/dashboard/dashboard_service";

const service = new DashboardService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);

    const filter = {
      category: searchParams.get("category") || null,
      is_active: searchParams.get("is_active") !== null ? searchParams.get("is_active") === "true" : null,
      tag: searchParams.get("tag") || null,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset"), 10) : undefined,
    };

    const [templates, total] = await service.ListTemplates(filter);

    return NextResponse.json({ data: templates, total }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
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

    const template = await service.CreateTemplate({
      name: body.name,
      description: body.description,
      category: body.category,
      layout: body.layout,
      widgets: body.widgets,
      tags: body.tags,
      thumbnail_url: body.thumbnail_url,
      created_by: body.created_by,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
