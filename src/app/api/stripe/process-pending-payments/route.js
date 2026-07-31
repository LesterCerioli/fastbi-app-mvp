import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { processSingleToken } from "@/services/get_token_transform_pm_service";
import { createPaymentIntent } from "@/services/stripe/paymentIntents";

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.stripe_token_id) {
      return NextResponse.json({
        error: "Missing required field: stripe_token_id"
      }, { status: 400 });
    }

    if (!body.user_name) {
      return NextResponse.json({
        error: "Missing required field: user_name"
      }, { status: 400 });
    }

    if (!body.user_email) {
      return NextResponse.json({
        error: "Missing required field: user_email"
      }, { status: 400 });
    }

    const result = await processSingleToken(
      body.stripe_token_id,
      body.user_name,
      body.user_email
    );

    if (!result) {
      return NextResponse.json({
        error: "Failed to convert token after 3 attempts"
      }, { status: 400 });
    }

    let paymentIntent = null;
    if (body.amount && body.currency) {
      paymentIntent = await createPaymentIntent(
        result.paymentMethodId,
        body.amount,
        body.currency
      );
    }

    return NextResponse.json({
      success: true,
      paymentMethod: result,
      paymentIntent,
    }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
