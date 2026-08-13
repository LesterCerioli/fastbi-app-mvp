import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:5455";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const organizationName = searchParams.get("organization_name");

  if (!organizationName) {
    return NextResponse.json(
      { error: "organization_name is required" },
      { status: 400 },
    );
  }

  try {
    const authRes = await fetch(new URL("/api/auth/token", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!authRes.ok) {
      return NextResponse.json({ error: "failed to obtain token" }, { status: 500 });
    }
    const { token } = await authRes.json();

    const qs = `organization_name=${encodeURIComponent(organizationName)}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    await fetch(`${API_URL}/api/v1/billing/reconcile?${qs}`, {
      method: "POST",
      headers,
    });

    const subRes = await fetch(`${API_URL}/api/v1/billing/subscriptions?${qs}`, { headers });
    if (!subRes.ok) {
      return NextResponse.json({ approve_link: null }, { status: 200 });
    }

    const sub = await subRes.json();
    return NextResponse.json({ approve_link: sub.approve_link || null }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "approval request failed" }, { status: 500 });
  }
}
