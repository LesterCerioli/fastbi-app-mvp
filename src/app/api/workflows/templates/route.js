import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { resolveOrganizationID } from "@/lib/org-resolver";
import { workflowService } from "@/services/workflows/workflow_service";

export async function GET(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const organizationID = await resolveOrganizationID(organizationName);

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (templateId) {
      const template = await workflowService.getTemplate(templateId);
      if (!template) {
        return NextResponse.json({ error: "template not found" }, { status: 404 });
      }
      if (template.organization_id !== organizationID) {
        return NextResponse.json({ error: "access denied" }, { status: 403 });
      }
      return NextResponse.json({ data: template }, { status: 200 });
    }

    const templates = await workflowService.listTemplates(organizationID);
    return NextResponse.json({ data: templates }, { status: 200 });
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
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const organizationID = await resolveOrganizationID(organizationName);

    const body = await request.json().catch(() => ({}));

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.definition) {
      return NextResponse.json({ error: "definition is required" }, { status: 400 });
    }

    const template = await workflowService.saveAsTemplate({
      organization_id: organizationID,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      definition: body.definition,
    });

    return NextResponse.json(template, { status: 201 });
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

export async function PUT(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const organizationID = await resolveOrganizationID(organizationName);

    const body = await request.json().catch(() => ({}));

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await workflowService.getTemplate(body.id);
    if (!existing) {
      return NextResponse.json({ error: "template not found" }, { status: 404 });
    }
    if (existing.organization_id !== organizationID) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    const updated = await workflowService.saveAsTemplate({
      organization_id: organizationID,
      name: body.name,
      description: body.description,
      category: body.category,
      definition: body.definition,
    });

    return NextResponse.json(updated, { status: 200 });
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

export async function DELETE(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const organizationID = await resolveOrganizationID(organizationName);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await workflowService.getTemplate(id);
    if (!existing) {
      return NextResponse.json({ error: "template not found" }, { status: 404 });
    }
    if (existing.organization_id !== organizationID) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    await workflowService.deleteWorkflowTemplate(id);
    return NextResponse.json({ message: "template deleted" }, { status: 200 });
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