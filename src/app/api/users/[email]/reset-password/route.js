import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";

const service = new UserService();

export async function POST(request, { params }) {
  try {
    await authenticate(request);

    const { email } = await params;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (!body.new_password) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    const user = await service.getSingleByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await service.setPassword(user.id, body.new_password);

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
