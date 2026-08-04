import { DynamoDBClient, ListTablesCommand, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "t-100",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "amadeus74367908",
  },
});

function buildDefs(keys: string[], gsiKeys: string[]): { AttributeName: string; AttributeType: string }[] {
  const all = new Set([...keys, ...gsiKeys]);
  return Array.from(all).map((n) => ({ AttributeName: n, AttributeType: "S" }));
}

const TABLES: Array<{
  name: string;
  keys: string[];
  gsiKeys: string[][];
}> = [
  {
    name: process.env.DYNAMODB_WORKERS_TABLE || "FASTBI_workers",
    keys: ["id"],
    gsiKeys: [["organization_id", "worker_id"]],
  },
  {
    name: process.env.DYNAMODB_WORKFLOWS_TABLE || "FASTBI_workflows",
    keys: ["id"],
    gsiKeys: [["organization_id", "workflow_id"]],
  },
  {
    name: process.env.DYNAMODB_WORKFLOW_TEMPLATES_TABLE || "FASTBI_workflow_templates",
    keys: ["id"],
    gsiKeys: [["organization_id", "template_id"]],
  },
];

async function getExistingTableNames(): Promise<string[]> {
  const res = await client.send(new ListTablesCommand({}));
  return res.TableNames || [];
}

async function main() {
  const existing = await getExistingTableNames();
  let created = 0;
  let skipped = 0;

  for (const t of TABLES) {
    if (existing.includes(t.name)) {
      console.log(`SKIP (exists): ${t.name}`);
      skipped++;
      continue;
    }

    const pkAttr = t.keys[0];
    const gsiDefs: string[] = [];
    for (const gsi of t.gsiKeys) {
      gsiDefs.push(gsi[0]);
      if (gsi.length > 1) gsiDefs.push(gsi[1]);
    }

    const allDefs = new Set([pkAttr, ...gsiDefs]);
    const attributeDefinitions = Array.from(allDefs).map((n) => ({
      AttributeName: n,
      AttributeType: "S" as const,
    }));

    const keySchema = [{ AttributeName: pkAttr, KeyType: "HASH" }] as Array<{ AttributeName: string; KeyType: string }>;

    const input: any = {
      TableName: t.name,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: "PAY_PER_REQUEST",
    };

    if (t.gsiKeys.length > 0) {
      input.GlobalSecondaryIndexes = t.gsiKeys.map((gsi, idx) => {
        const gsiName = `gsi${idx + 1}`;
        const gsiKeySchema: Array<{ AttributeName: string; KeyType: string }> = [
          { AttributeName: gsi[0], KeyType: "HASH" },
        ];
        if (gsi.length > 1) {
          gsiKeySchema.push({ AttributeName: gsi[1], KeyType: "RANGE" });
        }
        return {
          IndexName: gsiName,
          KeySchema: gsiKeySchema,
          Projection: { ProjectionType: "ALL" },
        };
      });
    }

    try {
      await client.send(new CreateTableCommand(input));
      console.log(`CREATED: ${t.name}`);
      created++;
    } catch (err: any) {
      console.error(`ERROR creating ${t.name}:`, err.message);
    }
  }

  console.log(`\nSummary: ${created} created, ${skipped} skipped`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});