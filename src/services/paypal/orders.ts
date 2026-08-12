interface PayPalCardInput {
  number: string;
  expiry: string;
  name: string;
  securityCode: string;
  billingAddress?: Record<string, unknown> | null;
}

interface CreateOrderInput {
  card: PayPalCardInput;
  amount: number;
  currency: string;
  customId?: string;
  description?: string;
}

function getApiBase(): string {
  const base = process.env.PAYPAL_BASE_URL;
  if (!base) {
    throw new Error("PAYPAL_BASE_URL is not set");
  }
  return base.replace(/\/$/, "");
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_SECRET are not set");
  }
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `PayPal OAuth error (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  return String(data.access_token || "");
}

function mapCardToPayPal(card: PayPalCardInput): Record<string, unknown> {
  const paypalCard: Record<string, unknown> = {
    number: card.number,
    expiry: card.expiry,
    name: card.name,
    security_code: card.securityCode,
  };

  if (card.billingAddress && typeof card.billingAddress === "object") {
    const address = card.billingAddress as Record<string, unknown>;
    paypalCard.billing_address = {
      address_line_1: address.line1 || address.address_line_1 || null,
      address_line_2: address.line2 || address.address_line_2 || null,
      admin_area_1: address.state || address.admin_area_1 || null,
      admin_area_2: address.city || address.admin_area_2 || null,
      postal_code: address.postal_code || address.zip || null,
      country_code: address.country || address.country_code || null,
    };
  }

  return paypalCard;
}

export async function createPayPalOrder(
  input: CreateOrderInput
): Promise<Record<string, unknown>> {
  const accessToken = await getAccessToken();

  const body: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: input.customId || input.card.number.slice(-4),
        description: input.description || "FastBI order",
        amount: {
          currency_code: input.currency,
          value: input.amount.toFixed(2),
        },
      },
    ],
    payment_source: {
      card: mapCardToPayPal(input.card),
    },
  };

  const response = await fetch(`${getApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `PayPal create order error (${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data as Record<string, unknown>;
}

export async function capturePayPalOrder(
  orderId: string
): Promise<Record<string, unknown>> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${getApiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: "{}",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `PayPal capture error (${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data as Record<string, unknown>;
}