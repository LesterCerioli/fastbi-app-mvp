import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const TABLE_NAME = "FastBI_user_profiles";

async function ensureUserProfilesTable(): Promise<void> {
  try {
    const existing = await client.send(new ListTablesCommand({}));
    if ((existing.TableNames || []).includes(TABLE_NAME)) {
      return;
    }
  } catch {
    /* fall through to creation attempt */
  }

  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
      BillingMode: "PAY_PER_REQUEST",
    })
  );
}

ensureUserProfilesTable();