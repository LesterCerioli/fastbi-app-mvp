import { NextResponse } from "next/server";
import { getOrganizationName } from "@/lib/session";

export async function GET(request) {
  try {
    const organizationName = await getOrganizationName();
    if (!organizationName) {
      return NextResponse.json({ error: "organization not set" }, { status: 400 });
    }
    return NextResponse.json({ organization_name: organizationName }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}