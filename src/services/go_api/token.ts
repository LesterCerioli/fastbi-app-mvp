let cachedToken: { token: string; expires_at: number } | null = null;

function getCredentials(): { clientId: string; secret: string; baseUrl: string } {
  const clientId = process.env.FASTBI_GO_CLIENT_ID_1;
  const secret = process.env.FASTBI_GO_SECRET_1;
  const baseUrl = process.env.FASTBI_GO_BASE_URL;
  if (!clientId || !secret || !baseUrl) {
    throw new Error(
      "FASTBI_GO_BASE_URL, FASTBI_GO_CLIENT_ID_1 and FASTBI_GO_SECRET_1 must be set"
    );
  }
  return { clientId, secret, baseUrl: baseUrl.replace(/\/$/, "") };
}

export async function getGoApiToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.token;
  }

  const { clientId, secret, baseUrl } = getCredentials();

  const response = await fetch(`${baseUrl}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, secret }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Go API token error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("Go API token response missing token");
  }

  const expiresAt = data.expires_at
    ? new Date(data.expires_at).getTime()
    : Date.now() + 9 * 60 * 1000;

  cachedToken = {
    token: data.token,
    expires_at: expiresAt - 60_000,
  };

  return cachedToken.token;
}