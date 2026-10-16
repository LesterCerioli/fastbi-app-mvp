export interface ClientCredentials {
  clientId: string;
  secret: string;
}

export function validateClientCredentials(
  clientId: string,
  secret: string,
): ClientCredentials {
  const clientIdEnv = process.env.CLIENT_ID_1;
  const secretEnv = process.env.SECRET_1;

  if (!clientIdEnv || !secretEnv) {
    throw new Error('CLIENT_ID_1 and SECRET_1 must be set in environment');
  }

  if (clientId !== clientIdEnv) {
    throw new Error('invalid client_id');
  }

  if (secret !== secretEnv) {
    throw new Error('invalid client secret');
  }

  return { clientId: clientIdEnv, secret: secretEnv };
}

export function buildTokenRequest(credentials: ClientCredentials): {
  client_id: string;
  secret: string;
} {
  return {
    client_id: credentials.clientId,
    secret: credentials.secret,
  };
}