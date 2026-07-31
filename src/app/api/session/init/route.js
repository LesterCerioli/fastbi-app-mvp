import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { query } from "@/services/db";
import { setOrganizationCookie } from "@/lib/session";

export async function POST(request) {
  try {
    await authenticate(request);
    const body = await request.json().catch(() => ({}));

    if (!body.organization_id) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
    }

    const result = await query(
      `SELECT name FROM public.organizations WHERE id = $1`,
      [body.organization_id]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "organization not found" }, { status: 404 });
    }

    const organizationName = result.rows[0].name;
    await setOrganizationCookie(organizationName);

    return NextResponse.json({ organization_name: organizationName }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
