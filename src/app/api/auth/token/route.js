import { NextResponse } from "next/server";
import { generateToken } from "@/services/auth_service";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId = body.client_id || process.env.CLIENT_ID_1;
    const secret = body.secret || process.env.SECRET_1;

    if (!clientId || !secret) {
      return NextResponse.json(
        { error: "client_id and secret are required" },
        { status: 400 },
      );
    }

    const result = await generateToken(clientId, secret);

    return NextResponse.json(
      { token: result.token },
      { status: 201 },
    );
  } catch (err) {
    const message = err.message || "Unknown error";

    if (message === "invalid client_id or secret") {
      return NextResponse.json(
        { error: "invalid client_id or secret" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "failed to generate token", details: message },
      { status: 500 },
    );
  }
}