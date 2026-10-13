import { DynamoDBClient, ListTablesCommand, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: "t-100",
    secretAccessKey: "amadeus74367908",
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
    name: process.env.DYNAMODB_REPORT_RUNS_TABLE || "FASTBI_report_runs",
    keys: ["id"],
    gsiKeys: [["organizationName", "runId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_RUN_STAGES_TABLE || "FASTBI_report_run_stages",
    keys: ["id"],
    gsiKeys: [["runId", "stageId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_TEMPLATES_TABLE || "FASTBI_report_templates",
    keys: ["id"],
    gsiKeys: [["organizationName", "templateId"], ["category"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_TEMPLATE_CATALOG_TABLE || "FASTBI_report_template_catalog",
    keys: ["id"],
    gsiKeys: [["organizationName", "templateCatalogId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_TEMPLATE_PREVIEWS_TABLE || "FASTBI_report_template_previews",
    keys: ["id"],
    gsiKeys: [["templateId", "previewId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_TEMPLATE_SECTIONS_TABLE || "FASTBI_report_template_sections",
    keys: ["id"],
    gsiKeys: [["templateId", "sectionId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_TEMPLATE_WIDGETS_TABLE || "FASTBI_report_template_widgets",
    keys: ["id"],
    gsiKeys: [["sectionId", "widgetId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_ARTIFACTS_TABLE || "FASTBI_report_artifacts",
    keys: ["id"],
    gsiKeys: [["jobId", "artifactId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_CSV_ARTIFACTS_TABLE || "FASTBI_report_csv_artifacts",
    keys: ["id"],
    gsiKeys: [["runId", "csvArtifactId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_JOBS_TABLE || "FASTBI_report_jobs",
    keys: ["id"],
    gsiKeys: [["organizationName", "jobId"], ["status"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_SCHEDULES_TABLE || "FASTBI_report_schedules",
    keys: ["id"],
    gsiKeys: [["organizationName", "scheduleId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_REVIEWS_TABLE || "FASTBI_report_reviews",
    keys: ["id"],
    gsiKeys: [["runId", "reviewId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_SECTION_OVERRIDES_TABLE || "FASTBI_report_section_overrides",
    keys: ["id"],
    gsiKeys: [["runId", "overrideId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_KNOWLEDGE_BASE_TABLE || "FASTBI_report_knowledge_base",
    keys: ["id"],
    gsiKeys: [["organizationName", "kbId"], ["sourceType"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_NARRATIVE_SECTIONS_TABLE || "FASTBI_report_narrative_sections",
    keys: ["id"],
    gsiKeys: [["runId", "narrativeId"]],
  },
  {
    name: process.env.DYNAMODB_REPORT_CSV_PROFILES_TABLE || "FASTBI_report_csv_profiles",
    keys: ["id"],
    gsiKeys: [["organizationName", "profileId"]],
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