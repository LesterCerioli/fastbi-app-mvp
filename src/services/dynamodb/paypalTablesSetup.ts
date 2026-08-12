import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  type KeySchemaElement,
  type AttributeDefinition,
  type GlobalSecondaryIndex,
} from "@aws-sdk/client-dynamodb";
import { PAYPAL_ORDERS_TABLE } from "./paypalOrders";
import { PAYPAL_CAPTURES_TABLE } from "./paypalCaptures";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const PAYPAL_CUSTOMERS_TABLE = "FastBI_PayPal_customers";
const PAYPAL_PAYMENT_METHODS_TABLE = "FastBI_PayPal_payment_methods";

const TABLES: Array<{
  name: string;
  keys: KeySchemaElement[];
  attributes: AttributeDefinition[];
  gsis?: GlobalSecondaryIndex[];
}> = [
  {
    name: PAYPAL_ORDERS_TABLE,
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attributes: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "organization_id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "processing_status", AttributeType: "S" },
    ],
    gsis: [
      {
        IndexName: "idx_organization_id",
        KeySchema: [{ AttributeName: "organization_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "idx_status",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "idx_processing_status",
        KeySchema: [{ AttributeName: "processing_status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    name: PAYPAL_CAPTURES_TABLE,
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attributes: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "organization_id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "capture_id", AttributeType: "S" },
    ],
    gsis: [
      {
        IndexName: "idx_capture_id",
        KeySchema: [{ AttributeName: "capture_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "idx_organization_id",
        KeySchema: [{ AttributeName: "organization_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "idx_status",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    name: PAYPAL_CUSTOMERS_TABLE,
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attributes: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    gsis: [
      {
        IndexName: "idx_email",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  {
    name: PAYPAL_PAYMENT_METHODS_TABLE,
    keys: [{ AttributeName: "id", KeyType: "HASH" }],
    attributes: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "paypal_order_id", AttributeType: "S" },
    ],
    gsis: [
      {
        IndexName: "idx_paypal_order_id",
        KeySchema: [{ AttributeName: "paypal_order_id", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
];

export async function ensurePayPalTables(): Promise<void> {
  const existing = await client.send(new ListTablesCommand({}));
  const existingNames = existing.TableNames || [];

  for (const table of TABLES) {
    if (existingNames.includes(table.name)) {
      continue;
    }
    await client.send(
      new CreateTableCommand({
        TableName: table.name,
        KeySchema: table.keys,
        AttributeDefinitions: table.attributes,
        ...(table.gsis && table.gsis.length > 0
          ? { GlobalSecondaryIndexes: table.gsis }
          : {}),
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  }
}

async function main(): Promise<void> {
  await ensurePayPalTables();
  console.log("FastBI_PayPal_* tables ensured on LocalStack");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err.message);
    process.exit(1);
  });
}