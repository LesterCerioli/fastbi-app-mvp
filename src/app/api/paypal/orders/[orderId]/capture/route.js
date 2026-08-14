import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "@/lib/api-auth";
import { capturePayPalOrder } from "@/services/paypal/orders";
import { savePayPalCapture } from "@/services/dynamodb/paypalCaptures";
import { getPayPalOrderById, updateOrderStatus } from "@/services/dynamodb/paypalOrders";

const PAYPAL_GENERIC_ERROR = "An internal error occurred. We are working to resolve this error. Please try again later.";

function extractCaptureFromResponse(data) {
  const purchaseUnits = data && data.purchase_units;
  if (!Array.isArray(purchaseUnits) || purchaseUnits.length === 0) return null;
  const payments = purchaseUnits[0] && purchaseUnits[0].payments;
  if (!payments || !Array.isArray(payments.captures) || payments.captures.length === 0) {
    return null;
  }
  return payments.captures[0];
}

export async function POST(request, { params }) {
  try {
    await authenticate(request);

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({
        error: "Missing required path param: orderId"
      }, { status: 400 });
    }

    const order = await getPayPalOrderById(orderId);
    if (!order) {
      return NextResponse.json({
        error: `PayPal order record not found: ${orderId}`
      }, { status: 404 });
    }

    let data;
    try {
      data = await capturePayPalOrder(order.paypal_order_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateOrderStatus(orderId, "FAILED", "failed");
      console.error(`[paypal] Capture failed for order ${orderId}: ${message}`);
      return NextResponse.json({ error: PAYPAL_GENERIC_ERROR }, { status: 400 });
    }

    const orderStatus = String(data.status || "");
    const capture = extractCaptureFromResponse(data);
    const processingStatus =
      orderStatus === "COMPLETED" ? "paid" : orderStatus === "FAILED" ? "failed" : "pending";

    await updateOrderStatus(orderId, orderStatus, processingStatus);

    let savedCapture = null;
    if (capture) {
      const now = new Date().toISOString();
      savedCapture = {
        id: uuidv4(),
        capture_id: String(capture.id || ""),
        paypal_order_id: order.paypal_order_id,
        organization_id: order.organization_id || undefined,
        payment_method_id: undefined,
        amount: Number((capture.amount && capture.amount.value) || 0),
        currency: String(
          (capture.amount && capture.amount.currency_code) || order.currency || "USD"
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

    return NextResponse.json({
      success: processingStatus === "paid",
      paypal_order_id: order.paypal_order_id,
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