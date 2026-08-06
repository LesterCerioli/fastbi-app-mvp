import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { getBillingOverview } from "@/services/dynamodb/billingService";
import { BillingOrganizationNotFoundError } from "@/services/dynamodb/billingService";

export async function GET(request) {
  try {
    await authenticate(request);

    const organizationName = await getOrganizationName();
    if (!organizationName) {
      return NextResponse.json({
        error: "session not initialized. call POST /api/session/init first"
      }, { status: 400 });
    }

    const customerEmail = request.nextUrl?.searchParams?.get("email") || "";
    const overview = await getBillingOverview(organizationName, customerEmail);

    return NextResponse.json(overview, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    if (err instanceof BillingOrganizationNotFoundError) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}