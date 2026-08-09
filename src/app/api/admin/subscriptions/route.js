import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { query } from "@/services/db";
import { getAdminSubscriptionsOverview } from "@/services/dynamodb/adminBillingService";

const FASTBI_ADMIN_ROLE = "FastBI Admin";

async function isFastBIAdmin(email) {
  const result = await query(
    `SELECT role FROM public.users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
    [email]
  );
  return result.rows[0]?.role === FASTBI_ADMIN_ROLE;
}

export async function GET(request) {
  try {
    await authenticate(request);

    const email = request.nextUrl?.searchParams?.get("email") || "";
    if (!email) {
      return NextResponse.json(
        { error: "email parameter is required" },
        { status: 400 }
      );
    }

    const isAdmin = await isFastBIAdmin(email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "NOT AUTHORIZED: FastBI Admin role required" },
        { status: 403 }
      );
    }

    const overview = await getAdminSubscriptionsOverview();

    return NextResponse.json(overview, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
