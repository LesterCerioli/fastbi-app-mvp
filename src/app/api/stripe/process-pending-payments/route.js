import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { processSingleToken } from "@/services/get_token_transform_pm_service";
import { createPaymentIntent } from "@/services/stripe/paymentIntents";
import { getPlanByKey, annualUnitAmount } from "@/lib/planLimits";

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

    let expectedAmount = null;
    if (body.plan_key) {
      const plan = getPlanByKey(body.plan_key);
      if (!plan) {
        return NextResponse.json({
          error: `Unknown plan_key: ${body.plan_key}`
        }, { status: 400 });
      }

      const userQuantity = Number(body.user_quantity);
      if (!Number.isInteger(userQuantity) || userQuantity < 1) {
        return NextResponse.json({
          error: "user_quantity must be a positive integer"
        }, { status: 400 });
      }

      if (plan.maxUsers !== null && userQuantity > plan.maxUsers) {
        return NextResponse.json({
          error: `plan '${plan.key}' supports up to ${plan.maxUsers} users`
        }, { status: 400 });
      }

      const unitAmount =
        body.billing_cycle === "annual"
          ? annualUnitAmount(plan)
          : plan.monthlyPrice;
      expectedAmount = unitAmount * userQuantity;

      if (expectedAmount !== Number(body.amount)) {
        return NextResponse.json({
          error: `amount mismatch: expected ${expectedAmount} for ${userQuantity} users on plan '${plan.key}'`
        }, { status: 400 });
      }
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
    if (expectedAmount !== null && body.currency) {
      paymentIntent = await createPaymentIntent(
        result.paymentMethodId,
        result.customerId,
        expectedAmount,
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
