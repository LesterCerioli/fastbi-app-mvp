import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getTokenByStripeTokenId, updateTokenStatus } from "@/services/dynamodb/stripePaymentTokens";
import { saveCustomer } from "@/services/dynamodb/stripeCustomers";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const MAX_ATTEMPTS = 3;

const CLIENT = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(CLIENT);

const PAYMENT_METHODS_TABLE = "FASTBI_stripe_payment_methods";

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_API_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_API_KEY is not set");
  }
  return key;
}

function encodeFormData(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findOrCreateCustomer(
  userEmail: string,
  userName: string
): Promise<string> {
  const secretKey = getSecretKey();

  const listUrl = `${STRIPE_API_BASE}/customers?email=${encodeURIComponent(userEmail)}&limit=1`;

  const listResponse = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
    },
  });

  if (listResponse.ok) {
    const listData = await listResponse.json();
    if (listData.data && listData.data.length > 0) {
      return listData.data[0].id;
    }
  }

  const createBody = encodeFormData({
    email: userEmail,
    name: userName,
  });

  const createResponse = await fetch(`${STRIPE_API_BASE}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
    },
    body: createBody,
  });

  if (!createResponse.ok) {
    const errorBody = await createResponse.text();
    throw new Error(
      `Stripe API error creating customer (${createResponse.status}): ${errorBody}`
    );
  }

  const customerData = await createResponse.json();
  return customerData.id;
}

interface StripeBillingDetails {
  address: {
    city: string | null;
    country: string | null;
    line1: string | null;
    line2: string | null;
    postal_code: string | null;
    state: string | null;
  };
  email: string | null;
  name: string | null;
  phone: string | null;
}

interface StripeCardDetails {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  fingerprint: string;
  country: string;
}

interface StripeBankAccountDetails {
  account_holder_type: string;
  account_type: string;
  bank_name: string;
  financial_connections_account: string | null;
  fingerprint: string;
  last4: string;
  networks: {
    preferred: string;
    supported: string[];
  };
  routing_number: string;
  status_details: Record<string, unknown>;
}

interface StripePaymentMethodResponse {
  id: string;
  object: string;
  allow_redisplay: string;
  billing_details: StripeBillingDetails;
  created: number;
  customer: string | null;
  livemode: boolean;
  metadata: Record<string, unknown>;
  type: string;
  card?: StripeCardDetails;
  us_bank_account?: StripeBankAccountDetails;
}

function buildPaymentMethodItem(
  stripeResponse: StripePaymentMethodResponse
): Record<string, unknown> {
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    payment_method_id: stripeResponse.id,
    object: stripeResponse.object,
    allow_redisplay: stripeResponse.allow_redisplay,
    billing_details: stripeResponse.billing_details,
    type: stripeResponse.type,
    created: stripeResponse.created,
    customer: stripeResponse.customer,
    livemode: stripeResponse.livemode,
    metadata: stripeResponse.metadata,
    card: stripeResponse.card ?? null,
    us_bank_account: stripeResponse.us_bank_account ?? null,
    created_at: now,
    updated_at: now,
  };
}

async function savePaymentMethod(
  stripeResponse: StripePaymentMethodResponse
): Promise<string> {
  const item = buildPaymentMethodItem(stripeResponse);

  await docClient.send(
    new PutCommand({
      TableName: PAYMENT_METHODS_TABLE,
      Item: item,
    })
  );

  return item.id as string;
}

interface PaymentMethodResult {
  id: string;
  paymentMethodId: string;
  customerId: string;
}

async function callStripePaymentMethods(
  stripeTokenId: string,
  userName: string,
  userEmail: string,
  customerId: string
): Promise<StripePaymentMethodResponse> {
  const secretKey = getSecretKey();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const body = encodeFormData({
        type: "card",
        "card[token]": stripeTokenId,
        "billing_details[name]": userName,
        "billing_details[email]": userEmail,
      });

      const response = await fetch(`${STRIPE_API_BASE}/payment_methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        },
        body,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Stripe API error (${response.status}): ${errorBody}`);
      }

      const data: StripePaymentMethodResponse = await response.json();

      if (!data.id || !data.id.startsWith("pm_")) {
        throw new Error(`Invalid payment method ID received: ${data.id}`);
      }

      // Stripe forbids attaching a PaymentMethod to a Customer during
      // creation; it must be created first and then attached explicitly.
      const attachResponse = await fetch(
        `${STRIPE_API_BASE}/payment_methods/${data.id}/attach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
          },
          body: encodeFormData({ customer: customerId }),
        }
      );

      if (!attachResponse.ok) {
        const errorBody = await attachResponse.text();
        throw new Error(`Stripe attach error (${attachResponse.status}): ${errorBody}`);
      }

      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === MAX_ATTEMPTS) {
        console.error(
          `[get_token_transform_pm_service] Failed after ${MAX_ATTEMPTS} attempts ` +
          `to convert token ${stripeTokenId}: ${lastError.message}`
        );
        throw lastError;
      }

      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await sleep(delayMs);
    }
  }

  throw lastError ?? new Error("Unexpected error in callStripePaymentMethods");
}

export async function processSingleToken(
  stripeTokenId: string,
  userName: string,
  userEmail: string
): Promise<PaymentMethodResult | null> {
  try {
    const customerId = await findOrCreateCustomer(userEmail, userName);

    const stripeResponse = await callStripePaymentMethods(
      stripeTokenId,
      userName,
      userEmail,
      customerId
    );

    const recordId = await savePaymentMethod(stripeResponse);

    await saveCustomer({
      id: uuidv4(),
      stripe_customer_id: customerId,
      email: userEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const tokenRecord = await getTokenByStripeTokenId(stripeTokenId);
    if (tokenRecord) {
      await updateTokenStatus(tokenRecord.id, "success");
    }

    console.log(
      `[get_token_transform_pm_service] Token ${stripeTokenId} converted ` +
      `to payment method ${stripeResponse.id} (customer: ${customerId}) ` +
      `and saved as ${recordId}` +
      (tokenRecord ? `, status updated to success` : ``)
    );

    return {
      id: recordId,
      paymentMethodId: stripeResponse.id,
      customerId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[get_token_transform_pm_service] Failed to convert token ${stripeTokenId}: ${message}`
    );
    return null;
  }
}
