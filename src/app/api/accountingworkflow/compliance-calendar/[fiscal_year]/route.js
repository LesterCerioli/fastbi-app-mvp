import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { AccountingWorkflowEngineService } from "@/services/accounting/accounting_workflow_engine_service";

const service = new AccountingWorkflowEngineService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const { fiscal_year } = await params;
    const { searchParams } = new URL(request.url);

    const fiscalYear = parseInt(fiscal_year, 10);
    if (isNaN(fiscalYear)) {
      return NextResponse.json({ error: "invalid fiscal_year" }, { status: 400 });
    }

    const calendar = await service.getComplianceCalendar(organizationName, fiscalYear);
    return NextResponse.json(calendar, { status: 200 });
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
