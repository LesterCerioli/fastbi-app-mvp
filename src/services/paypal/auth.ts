let cachedToken: { access_token: string; expires_at: number } | null = null;

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL;
  if (!clientId || !secret || !baseUrl) {
    throw new Error("PAYPAL_CLIENT_ID, PAYPAL_SECRET and PAYPAL_BASE_URL must be set");
  }
  return { clientId, secret, baseUrl };
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  const { clientId, secret, baseUrl } = getCredentials();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PayPal OAuth2 error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("PayPal OAuth2 response missing access_token");
  }

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (Number(data.expires_in) || 5400) * 1000 - 60000,
  };

  return cachedToken.access_token;
}