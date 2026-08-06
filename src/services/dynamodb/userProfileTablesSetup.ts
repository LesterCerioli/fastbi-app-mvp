import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
} from "@aws-sdk/client-dynamodb";
import { TABLE_NAME } from "./userProfiles";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function ensureUserProfilesTable(): Promise<void> {
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
