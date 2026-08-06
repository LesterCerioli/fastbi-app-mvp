import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.DYNAMODB_USER_PROFILES_TABLE || "FastBI_user_profiles";

export async function getAvatarUrl(userId: string): Promise<string | null> {
  try {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { userId } })
    );
    return result.Item?.avatar_url || null;
  } catch {
    return null;
  }
}

export async function saveAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: "SET avatar_url = :url",
      ExpressionAttributeValues: { ":url": avatarUrl },
    })
  );
}

export async function ensureProfile(userId: string): Promise<void> {
  const existing = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { userId } })
  );
  if (!existing.Item) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { userId, avatar_url: null, createdAt: new Date().toISOString() },
      })
    );
  }
}
