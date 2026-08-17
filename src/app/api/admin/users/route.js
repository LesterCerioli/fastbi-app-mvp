import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { UserService } from "@/services/users/user_service";

const FASTBI_ADMIN_ROLE = "FastBI Admin";
const userService = new UserService();

async function isFastBIAdmin(email) {
  const result = await userService.getSingleByEmail(email);
  return result?.role === FASTBI_ADMIN_ROLE;
}

export async function GET(request) {
  try {
    await authenticate(request);

    const email = request.nextUrl?.searchParams?.get("email") || "";
    if (!email) {
      return NextResponse.json(
        { error: "email parameter is required" },
        { status: 400 }
      );
    }

    const isAdmin = await isFastBIAdmin(email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "NOT AUTHORIZED: FastBI Admin role required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const users = await userService.getAllUsersWithOrganization(limit, offset);

    return NextResponse.json(users, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}