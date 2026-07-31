import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";

const userService = new UserService();

export async function PATCH(request) {
  try {
    await authenticate(request);
    const { userId, name, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await userService.updateUser(userId, name, role);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message || "Failed to update profile" }, { status: 400 });
  }
}
