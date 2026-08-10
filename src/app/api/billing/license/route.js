import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "@/lib/api-auth";
import { getPlanByKey } from "@/lib/planLimits";
import {
  getLicenseByOrganizationId,
  upsertOrganizationLicense,
} from "@/services/dynamodb/organizationLicenses";
import { ensureOrganizationLicensesTable } from "@/services/dynamodb/licenseTablesSetup";

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.organization_id) {
      return NextResponse.json({
        error: "Missing required field: organization_id"
      }, { status: 400 });
    }

    if (!body.plan_key) {
      return NextResponse.json({
        error: "Missing required field: plan_key"
      }, { status: 400 });
    }

    const plan = getPlanByKey(body.plan_key);
    if (!plan) {
      return NextResponse.json({
        error: `Unknown plan_key: ${body.plan_key}`
      }, { status: 400 });
    }

    const userQuantity = Number(body.user_quantity);
    if (!Number.isInteger(userQuantity) || userQuantity < 1) {
      return NextResponse.json({
        error: "user_quantity must be a positive integer"
      }, { status: 400 });
    }

    if (plan.maxUsers !== null && userQuantity > plan.maxUsers) {
      return NextResponse.json({
        error: `plan '${plan.key}' supports up to ${plan.maxUsers} users`
      }, { status: 400 });
    }

    await ensureOrganizationLicensesTable();

    const existing = await getLicenseByOrganizationId(body.organization_id);
    const now = new Date().toISOString();

    await upsertOrganizationLicense({
      id: existing?.id || uuidv4(),
      organization_id: body.organization_id,
      plan_key: plan.key,
      user_quantity: userQuantity,
      billing_cycle: body.billing_cycle === "annual" ? "annual" : "monthly",
      created_at: existing?.created_at || now,
      updated_at: now,
    });

    return NextResponse.json({
      success: true,
      organization_id: body.organization_id,
      plan_key: plan.key,
      user_quantity: userQuantity,
    }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}