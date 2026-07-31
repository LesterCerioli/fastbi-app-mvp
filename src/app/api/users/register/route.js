import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";

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
