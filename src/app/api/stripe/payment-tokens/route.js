import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { createToken, getTokenById, listTokensByStatus } from "@/services/dynamodb/stripePaymentTokens";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.stripe_token_id) {
      return NextResponse.json({
        error: "Missing required field: stripe_token_id"
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const token = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      stripe_token_id: body.stripe_token_id,
      status: body.status || "pending",
    };

    await createToken(token);

    return NextResponse.json(token, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");

    if (id) {
      const token = await getTokenById(id);
      if (!token) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
      }
      return NextResponse.json(token, { status: 200 });
    }

    if (status) {
      const tokens = await listTokensByStatus(status);
      return NextResponse.json(tokens, { status: 200 });
    }

    return NextResponse.json({
      error: "Specify a query parameter: id or status"
    }, { status: 400 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
