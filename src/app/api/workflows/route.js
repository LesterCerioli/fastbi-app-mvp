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
    const workflowId = searchParams.get("id");

    if (workflowId) {
      const workflow = await workflowService.getWorkflow(workflowId);
      if (!workflow) {
        return NextResponse.json({ error: "workflow not found" }, { status: 404 });
      }
      if (workflow.organization_id !== organizationID) {
        return NextResponse.json({ error: "access denied" }, { status: 403 });
      }
      return NextResponse.json({ data: workflow }, { status: 200 });
    }

    const workflows = await workflowService.listWorkflows(organizationID);
    return NextResponse.json({ data: workflows }, { status: 200 });
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

    const workflow = await workflowService.createWorkflow({
      organization_id: organizationID,
      name: body.name,
      description: body.description || null,
      definition: body.definition,
      steps: body.steps || [],
    });

    return NextResponse.json(workflow, { status: 201 });
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

    const existing = await workflowService.getWorkflow(body.id);
    if (!existing) {
      return NextResponse.json({ error: "workflow not found" }, { status: 404 });
    }
    if (existing.organization_id !== organizationID) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    const updated = await workflowService.updateWorkflow(body.id, {
      name: body.name,
      description: body.description,
      status: body.status,
      definition: body.definition,
      steps: body.steps,
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

    const existing = await workflowService.getWorkflow(id);
    if (!existing) {
      return NextResponse.json({ error: "workflow not found" }, { status: 404 });
    }
    if (existing.organization_id !== organizationID) {
      return NextResponse.json({ error: "access denied" }, { status: 403 });
    }

    await workflowService.deleteWorkflow(id);
    return NextResponse.json({ message: "workflow deleted" }, { status: 200 });
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