import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_STRIPE_PAYMENT_TOKENS_TABLE || "FASTBI_stripe_payment_tokens";

export interface StripePaymentToken {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  stripe_token_id: string;
  status: string;
  used_at?: string;
  stripe_payment_intent_id?: string;
}

export async function createToken(token: StripePaymentToken): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: token,
    })
  );
}

export async function getTokenById(id: string): Promise<StripePaymentToken | null> {
  try {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id } })
    );
    return (result.Item as StripePaymentToken) || null;
  } catch {
    return null;
  }
}

export async function updateTokenStatus(
  id: string,
  status: string,
  stripePaymentIntentId?: string
): Promise<void> {
  const updateExpression = stripePaymentIntentId
    ? "SET #status = :status, stripe_payment_intent_id = :pid, updated_at = :now"
    : "SET #status = :status, updated_at = :now";

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":now": new Date().toISOString(),
        ...(stripePaymentIntentId ? { ":pid": stripePaymentIntentId } : {}),
      },
    })
  );
}

export async function markTokenUsed(id: string, stripePaymentIntentId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET #status = :status, used_at = :now, stripe_payment_intent_id = :pid, updated_at = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "used",
        ":now": new Date().toISOString(),
        ":pid": stripePaymentIntentId,
      },
    })
  );
}

export async function softDeleteToken(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET deleted_at = :now, updated_at = :now",
      ExpressionAttributeValues: {
        ":now": new Date().toISOString(),
      },
    })
  );
}

export async function getTokenByStripeTokenId(stripeTokenId: string): Promise<StripePaymentToken | null> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "stripe_token_id = :sid",
        ExpressionAttributeValues: { ":sid": stripeTokenId },
      })
    );
    if (!result.Items || result.Items.length === 0) return null;
    return result.Items[0] as StripePaymentToken;
  } catch {
    return null;
  }
}

export async function listTokensByStatus(status: string): Promise<StripePaymentToken[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "idx_status",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      })
    );
    return (result.Items as StripePaymentToken[]) || [];
  } catch {
    return [];
  }
}
