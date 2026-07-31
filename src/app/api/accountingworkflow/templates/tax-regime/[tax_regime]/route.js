import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { AccountingWorkflowEngineService } from "@/services/accounting/accounting_workflow_engine_service";

const service = new AccountingWorkflowEngineService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { tax_regime } = await params;

    const templates = await service.getTemplatesByTaxRegime(tax_regime);
    return NextResponse.json({ data: templates }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
