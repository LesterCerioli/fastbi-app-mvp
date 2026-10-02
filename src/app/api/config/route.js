import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";

export async function GET(request) {
  try {
    await authenticate(request);
    return NextResponse.json({
      authTokenEndpoint: process.env.AUTH_TOKEN_ENDPOINT,
      loginEndpoint: process.env.LOGIN_API_ENDPOINT,
      resetPasswordEndpoint: process.env.RESET_PASSWORD_ENDPOINT,
      baseUrl: process.env.BASE_URL,
    });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
