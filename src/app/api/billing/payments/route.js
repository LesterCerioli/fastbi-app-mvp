import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { listGoPaidPayments } from "@/services/go_api/billing";

export async function GET(request) {
  try {
    await authenticate(request);
    const payments = await listGoPaidPayments();
    return NextResponse.json(payments, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}