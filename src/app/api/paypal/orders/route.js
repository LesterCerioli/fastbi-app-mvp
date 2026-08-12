import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "@/lib/api-auth";
import { getPlanByKey, annualUnitAmount } from "@/lib/planLimits";
import { createPayPalOrder } from "@/services/paypal/orders";
import { savePayPalOrder } from "@/services/dynamodb/paypalOrders";
import { savePayPalCapture } from "@/services/dynamodb/paypalCaptures";
import { findOrCreatePayPalCustomer } from "@/services/dynamodb/paypalCustomers";
import { savePayPalPaymentMethod } from "@/services/dynamodb/paypalPaymentMethods";
import { ensurePayPalTables } from "@/services/dynamodb/paypalTablesSetup";

function normalizeExpiry(expiry) {
  const trimmed = (expiry || "").trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}`;
  const short = trimmed.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (short) {
    const month = short[1];
    const year = Number(short[2]) >= 70 ? `19${short[2]}` : `20${short[2]}`;
    return `${year}-${month}`;
  }
  return trimmed;
}

function extractCaptureFromResponse(data) {
  const purchaseUnits = data && data.purchase_units;
  if (!Array.isArray(purchaseUnits) || purchaseUnits.length === 0) return null;
  const payments = purchaseUnits[0] && purchaseUnits[0].payments;
  if (!payments || !Array.isArray(payments.captures) || payments.captures.length === 0) {
    return null;
  }
  return payments.captures[0];
}

function extractCardFromResponse(data) {
  const paymentSource = data && data.payment_source;
  if (!paymentSource || typeof paymentSource !== "object") return null;
  const card = paymentSource.card;
  if (!card || typeof card !== "object") return null;
  return card;
}

export async function POST(request) {
  try {
    await authenticate(request);

    const body = await request.json().catch(() => ({}));

    if (!body.card_number || !body.card_expiry || !body.card_security_code) {
      return NextResponse.json({
        error: "Missing required fields: card_number, card_expiry, card_security_code"
      }, { status: 400 });
    }

    if (!body.cardholder_name) {
      return NextResponse.json({
        error: "Missing required field: cardholder_name"
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

    await ensurePayPalTables();

    const now = new Date().toISOString();
    const orderRecordId = uuidv4();

    let data;
    try {
      data = await createPayPalOrder({
        card: {
          number: body.card_number,
          expiry: normalizeExpiry(body.card_expiry),
          name: body.cardholder_name,
          securityCode: body.card_security_code,
          billingAddress: body.billing_address || null,
        },
        amount: expectedAmount ?? Number(body.amount) ?? 0,
        currency: body.currency || "USD",
        customId: body.plan_key || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await savePayPalOrder({
        id: orderRecordId,
        paypal_order_id: "",
        organization_id: body.organization_id || undefined,
        user_email: body.user_email,
        plan_key: body.plan_key || undefined,
        billing_cycle: body.billing_cycle || undefined,
        user_quantity: body.user_quantity ? Number(body.user_quantity) : undefined,
        amount: expectedAmount ?? Number(body.amount) ?? undefined,
        currency: body.currency || "USD",
        intent: "CAPTURE",
        status: "FAILED",
        processing_status: "failed",
        response_json: JSON.stringify({ error: message }),
        created_at: now,
        updated_at: now,
      });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const orderStatus = String(data.status || "");
    const capture = extractCaptureFromResponse(data);
    const processingStatus =
      orderStatus === "COMPLETED" ? "paid" : orderStatus === "FAILED" ? "failed" : "pending";

    const payerId = String((data.payer && data.payer.payer_id) || "");
    if (payerId && body.user_email) {
      await findOrCreatePayPalCustomer(
        body.user_email,
        payerId,
        body.organization_id || undefined
      );
    }

    let paymentMethodId = null;
    const card = extractCardFromResponse(data);
    if (card) {
      const paymentMethod = {
        id: uuidv4(),
        paypal_order_id: String(data.id || ""),
        type: "card",
        card_brand: String(card.brand || ""),
        card_last_digits: String(card.last_digits || ""),
        card_expiry: String(card.expiry || ""),
        cardholder_name: String(card.name || ""),
        billing_address: card.billing_address
          ? JSON.stringify(card.billing_address)
          : undefined,
        response_json: JSON.stringify(card),
        created_at: now,
        updated_at: now,
      };
      await savePayPalPaymentMethod(paymentMethod);
      paymentMethodId = paymentMethod.id;
    }

    await savePayPalOrder({
      id: orderRecordId,
      paypal_order_id: String(data.id || ""),
      organization_id: body.organization_id || undefined,
      payment_method_id: paymentMethodId || undefined,
      user_email: body.user_email,
      plan_key: body.plan_key || undefined,
      billing_cycle: body.billing_cycle || undefined,
      user_quantity: body.user_quantity ? Number(body.user_quantity) : undefined,
      amount: expectedAmount ?? Number(body.amount) ?? undefined,
      currency: body.currency || "USD",
      intent: "CAPTURE",
      status: orderStatus,
      processing_status: processingStatus,
      payer_id: String((data.payer && data.payer.payer_id) || ""),
      payer_email: String((data.payer && data.payer.email_address) || ""),
      purchase_units: JSON.stringify(data.purchase_units || null),
      links: JSON.stringify(data.links || null),
      request_json: "",
      response_json: JSON.stringify(data),
      created_at: now,
      updated_at: now,
    });

    let savedCapture = null;
    if (capture) {
      savedCapture = {
        id: uuidv4(),
        capture_id: String(capture.id || ""),
        paypal_order_id: String(data.id || ""),
        organization_id: body.organization_id || undefined,
        payment_method_id: paymentMethodId || undefined,
        amount: Number((capture.amount && capture.amount.value) || 0),
        currency: String(
          (capture.amount && capture.amount.currency_code) || body.currency || "USD"
        ),
        status: String(capture.status || ""),
        final_capture: Boolean(capture.final_capture),
        seller_receivable_breakdown: capture.seller_receivable_breakdown
          ? JSON.stringify(capture.seller_receivable_breakdown)
          : undefined,
        response_json: JSON.stringify(capture),
        created_at: now,
        updated_at: now,
      };
      await savePayPalCapture(savedCapture);
    }

    console.log(
      `[paypal] Order ${data.id} created, status: ${orderStatus}, ` +
      `processing_status: ${processingStatus}`
    );

    return NextResponse.json({
      success: processingStatus === "paid",
      paypal_order_id: String(data.id || ""),
      status: orderStatus,
      processing_status: processingStatus,
      capture: savedCapture,
    }, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";
    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "NOT AUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}