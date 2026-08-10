import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";
import { getLicenseByOrganizationId } from "@/services/dynamodb/organizationLicenses";
import { getPlanByKey } from "@/lib/planLimits";

const service = new UserService();

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.name || !body.email || !body.password || !body.role || !body.organization_name) {
      return NextResponse.json({
        error: "Missing required fields: name, email, password, role or organization_name"
      }, { status: 400 });
    }

    const orgId = await service.getOrganizationIdByName(body.organization_name);
    if (!orgId) {
      return NextResponse.json({
        error: `organization '${body.organization_name}' not found`
      }, { status: 404 });
    }

    const license = await getLicenseByOrganizationId(orgId);
    if (license) {
      const plan = getPlanByKey(license.plan_key);
      const effectiveLimit =
        plan && plan.maxUsers !== null
          ? Math.min(license.user_quantity, plan.maxUsers)
          : null;

      if (effectiveLimit !== null) {
        const currentCount = await service.getUserCountByOrganization(
          body.organization_name
        );
        if (currentCount >= effectiveLimit) {
          return NextResponse.json({
            error: `user limit reached: plan '${license.plan_key}' allows up to ${effectiveLimit} users`
          }, { status: 409 });
        }
      }
    }

    const user = await service.createWithOrganizationName(
      body.name,
      body.email,
      body.password,
      body.role,
      body.organization_name,
    );

    return NextResponse.json({ message: "User registered successfully", user }, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "email already exists") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes("organization '") && message.includes("' not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
