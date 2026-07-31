import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { LoginService } from "@/services/loginService";

const loginService = new LoginService();

export async function POST(request) {
  try {
    await authenticate(request);
    const body = await request.json();

    if (!body.email || !body.password || !body.role) {
      return NextResponse.json({ error: "Email, password and role are required" }, { status: 400 });
    }

    const { ok, user } = await loginService.verifyCredentials(body.email, body.password, body.role);

    if (!ok || !user) {
      return NextResponse.json({ error: "Invalid email, password or role" }, { status: 401 });
    }

    return NextResponse.json({ message: "Login successful", user }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
