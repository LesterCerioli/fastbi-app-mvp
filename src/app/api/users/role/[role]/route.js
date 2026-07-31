import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";

const service = new UserService();

export async function GET(request, { params }) {
  try {
    await authenticate(request);

    const { role } = await params;
    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const users = await service.getByRole(role);
    if (users.length === 0) {
      return NextResponse.json({ error: "No users found with the provided role" }, { status: 404 });
    }

    return NextResponse.json(users, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
