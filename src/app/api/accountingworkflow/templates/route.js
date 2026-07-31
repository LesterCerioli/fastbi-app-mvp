import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { AccountingWorkflowEngineService } from "@/services/accounting/accounting_workflow_engine_service";
import { query } from "@/services/db";

const service = new AccountingWorkflowEngineService();

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const taxRegime = searchParams.get("tax_regime");

    if (taxRegime) {
      const templates = await service.getTemplatesByTaxRegime(taxRegime);
      return NextResponse.json({ data: templates }, { status: 200 });
    }

    if (category) {
      const templates = await service.getTemplatesByCategory(category);
      return NextResponse.json({ data: templates }, { status: 200 });
    }

    const result = await query(
      `SELECT id, name, category, tax_regime, fiscal_period, regulatory_body,
              structure_json, created_by, created_at, updated_at
       FROM public.accounting_workflow_templates
       ORDER BY created_at DESC`
    );

    const templates = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      tax_regime: row.tax_regime || undefined,
      fiscal_period: row.fiscal_period || undefined,
      regulatory_body: row.regulatory_body || undefined,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      created_by: row.created_by || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ data: templates }, { status: 200 });
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
    if (!body.category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }
    if (!body.structure) {
      return NextResponse.json({ error: "structure is required" }, { status: 400 });
    }

    const template = await service.createTemplate(
      body.name,
      body.category,
      body.structure,
      body.created_by || undefined,
      body.tax_regime || undefined,
      body.fiscal_period || undefined,
      body.regulatory_body || undefined,
      body.workflow_definition || undefined,
      body.description || undefined,
      body.tags || undefined,
    );

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
