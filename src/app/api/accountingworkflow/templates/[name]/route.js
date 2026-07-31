import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { AccountingWorkflowEngineService } from "@/services/accounting/accounting_workflow_engine_service";

const service = new AccountingWorkflowEngineService();

export async function PUT(request, { params }) {
  try {
    await authenticate(request);

    const { name } = await params;
    const body = await request.json().catch(() => ({}));

    if (!body.category) {
      return NextResponse.json({ error: "category is required to resolve template" }, { status: 400 });
    }

    const templateID = await service.resolveTemplateIDByName(name, body.category);

    const template = await service.updateTemplate(templateID, {
      name: body.name,
      category: body.category,
      structure: body.structure,
      taxRegime: body.tax_regime,
      fiscalPeriod: body.fiscal_period,
    });

    return NextResponse.json(template, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.startsWith("accounting template not found") || message.startsWith("template not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
