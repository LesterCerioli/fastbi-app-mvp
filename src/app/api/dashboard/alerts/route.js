import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { getOrganizationName } from "@/lib/session";
import { query } from "@/services/db";

export async function GET(request) {
  try {
    await authenticate(request);
    const organizationName = await getOrganizationName();

    if (!organizationName) {
      return NextResponse.json({ error: "session not initialized" }, { status: 400 });
    }

    const result = await query(
      `SELECT id, insight_type, severity, title, description, confidence, created_at
       FROM public.agent_insights
       WHERE organization_id = (SELECT id FROM public.organizations WHERE name = $1)
         AND is_dismissed = false
       ORDER BY created_at DESC
       LIMIT 20`,
      [organizationName]
    );

    const alerts = result.rows.map(r => ({
      id: r.id,
      type: r.insight_type || "info",
      severity: r.severity || "info",
      title: r.title,
      description: r.description,
      confidence: r.confidence,
      created_at: r.created_at,
    }));

    return NextResponse.json({ organization_name: organizationName, alerts }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
