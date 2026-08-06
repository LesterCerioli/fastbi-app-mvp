import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const TABLE_NAME = "FASTBI_payment_intents";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_API_KEY;
  if (!key) throw new Error("STRIPE_SECRET_API_KEY is not set");
  return key;
}

function encodeFormData(data: Record<string, string | number>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export interface PaymentIntentRecord {
  id: string;
  payment_intent_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  processing_status: "paid" | "failed";
  status: string;
  client_secret: string | null;
  response_json: string;
  created_at: string;
  updated_at: string;
}

export async function createPaymentIntent(
  paymentMethodId: string,
  customerId: string,
  amount: number,
  currency: string
): Promise<PaymentIntentRecord | null> {
  const secretKey = getSecretKey();
  const amountInCents = Math.round(amount * 100);

  try {
    const body = encodeFormData({
      amount: amountInCents,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: "true",
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
    });

    const response = await fetch(`${STRIPE_API_BASE}/payment_intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
      body,
    });

    const responseData = await response.json();
    const now = new Date().toISOString();

    const succeeded = response.ok && responseData.status === "succeeded";

    const record: PaymentIntentRecord = {
      id: uuidv4(),
      payment_intent_id: responseData.id || "",
      payment_method_id: paymentMethodId,
      amount: amountInCents,
      currency,
      processing_status: succeeded ? "paid" : "failed",
      status: responseData.status || "unknown",
      client_secret: responseData.client_secret || null,
      response_json: JSON.stringify(responseData),
      created_at: now,
      updated_at: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: record,
      })
    );

    console.log(
      `[paymentIntents] Payment intent ${record.payment_intent_id} ` +
      `created for PM ${paymentMethodId}, ` +
      `processing_status: ${record.processing_status}, ` +
      `stripe status: ${record.status}`
    );

    return record;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[paymentIntents] Failed to create payment intent for PM ${paymentMethodId}: ${message}`);

    const now = new Date().toISOString();
    const failedRecord: PaymentIntentRecord = {
      id: uuidv4(),
      payment_intent_id: "",
      payment_method_id: paymentMethodId,
      amount: Math.round(amount * 100),
      currency,
      processing_status: "failed",
      status: "error",
      client_secret: null,
      response_json: JSON.stringify({ error: message }),
      created_at: now,
      updated_at: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: failedRecord,
      })
    );

    return failedRecord;
  }
}
