import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { validateToken } from "@/services/auth_service";

export async function POST(request) {
  try {
    await authenticate(request);
    const body = await request.json().catch(() => ({}));

    if (!body.token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 },
      );
    }

    await validateToken(body.token);

    return NextResponse.json(
      { message: "SUCCESS", status: "AUTHORIZED" },
      { status: 200 },
    );
  } catch (err) {
    const message = err.message || "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json(
        { error: "NOT AUTHORIZED", reason: message },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}