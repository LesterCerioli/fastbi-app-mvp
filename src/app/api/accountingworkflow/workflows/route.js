import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { AccountingWorkflowEngineService } from "@/services/accounting/accounting_workflow_engine_service";

const service = new AccountingWorkflowEngineService();

export async function POST(request) {
  try {
    await authenticate(request);

    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    if (!body.template_name) {
      return NextResponse.json({ error: "template_name is required" }, { status: 400 });
    }
    if (!body.template_category) {
      return NextResponse.json({ error: "template_category is required" }, { status: 400 });
    }
    if (!body.fiscal_year) {
      return NextResponse.json({ error: "fiscal_year is required" }, { status: 400 });
    }

    const templateID = await service.resolveTemplateIDByName(body.template_name, body.template_category);

    const workflow = await service.createWorkflowFromTemplate(
      templateID,
      organizationName,
      body.fiscal_year,
      body.fiscal_period || undefined,
      body.name || undefined,
      body.customization || undefined,
    );

    return NextResponse.json(workflow, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("accounting workflow template not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("organization") && message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
