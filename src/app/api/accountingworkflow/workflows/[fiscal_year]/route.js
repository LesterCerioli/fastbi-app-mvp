import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { AccountingWorkflowEngineService } from "@/services/accounting/accounting_workflow_engine_service";

const service = new AccountingWorkflowEngineService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { fiscal_year } = await params;
    const { searchParams } = new URL(request.url);
    const organizationName = searchParams.get("organization_name");

    if (!organizationName) {
      return NextResponse.json({ error: "organization_name is required" }, { status: 400 });
    }

    const fiscalYear = parseInt(fiscal_year, 10);
    if (isNaN(fiscalYear)) {
      return NextResponse.json({ error: "invalid fiscal_year" }, { status: 400 });
    }

    const fiscalPeriod = searchParams.get("fiscal_period") || undefined;

    const workflows = await service.getWorkflowsByFiscalPeriod(organizationName, fiscalYear, fiscalPeriod);
    return NextResponse.json({ data: workflows }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (message.includes("organization") && message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
