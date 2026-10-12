import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const ORGANIZATION_LICENSES_TABLE = "FASTBI_organization_licenses";

async function ensureOrganizationLicensesTable(): Promise<void> {
  try {
    const existing = await client.send(new ListTablesCommand({}));
    if ((existing.TableNames || []).includes(ORGANIZATION_LICENSES_TABLE)) {
      return;
    }
  } catch {
    /* fall through to creation attempt */
  }

  await client.send(
    new CreateTableCommand({
      TableName: ORGANIZATION_LICENSES_TABLE,
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "idx_organization_id",
          KeySchema: [{ AttributeName: "organization_id", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    })
  );
}

ensureOrganizationLicensesTable();