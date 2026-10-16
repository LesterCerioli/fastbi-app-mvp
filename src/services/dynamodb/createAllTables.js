const { DynamoDBClient, ListTablesCommand, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

async function ensureTable(name, keySchema, attributeDefinitions, globalSecondaryIndexes) {
  const existing = await client.send(new ListTablesCommand({}));
  const existingNames = existing.TableNames || [];

  if (existingNames.includes(name)) {
    console.log(`SKIP (exists): ${name}`);
    return;
  }

  const gsiDefs = globalSecondaryIndexes && globalSecondaryIndexes.length > 0
    ? globalSecondaryIndexes.map(gsi => ({
        IndexName: gsi.IndexName,
        KeySchema: gsi.KeySchema,
        Projection: gsi.Projection,
      }))
    : {};

  await client.send(
    new CreateTableCommand({
      TableName: name,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      ...gsiDefs,
      BillingMode: "PAY_PER_REQUEST",
    })
  );
  console.log(`CREATED: ${name}`);
}

async function main() {
  const tablesWithoutGSI = [
    {
      name: "FastBI_user_profiles",
      keySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
      attributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
    },
    {
      name: "FASTBI_ORGANIZATIONS",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    },
    {
      name: "FASTBI_general_files",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    },
  ];

  const tablesWithGSI = [
    {
      name: "FASTBI_workers",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
        { AttributeName: "worker_id", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organization_id", KeyType: "HASH" },
            { AttributeName: "worker_id", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_workflows",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
        { AttributeName: "workflow_id", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organization_id", KeyType: "HASH" },
            { AttributeName: "workflow_id", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_workflow_templates",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
        { AttributeName: "template_id", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organization_id", KeyType: "HASH" },
            { AttributeName: "template_id", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },

    {
      name: "FASTBI_report_runs",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "runId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "runId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "gsi2",
          KeySchema: [
            { AttributeName: "status", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_run_stages",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "runId", AttributeType: "S" },
        { AttributeName: "stageId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "runId", KeyType: "HASH" },
            { AttributeName: "stageId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_templates",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "templateId", AttributeType: "S" },
        { AttributeName: "category", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "templateId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "gsi2",
          KeySchema: [
            { AttributeName: "category", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_template_catalog",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "templateCatalogId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "templateCatalogId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_template_previews",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "templateId", AttributeType: "S" },
        { AttributeName: "previewId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "templateId", KeyType: "HASH" },
            { AttributeName: "previewId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_template_sections",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "templateId", AttributeType: "S" },
        { AttributeName: "sectionId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "templateId", KeyType: "HASH" },
            { AttributeName: "sectionId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_template_widgets",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "sectionId", AttributeType: "S" },
        { AttributeName: "widgetId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "sectionId", KeyType: "HASH" },
            { AttributeName: "widgetId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_artifacts",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "jobId", AttributeType: "S" },
        { AttributeName: "artifactId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "jobId", KeyType: "HASH" },
            { AttributeName: "artifactId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_csv_artifacts",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "runId", AttributeType: "S" },
        { AttributeName: "csvArtifactId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "runId", KeyType: "HASH" },
            { AttributeName: "csvArtifactId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_jobs",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "jobId", AttributeType: "S" },
        { AttributeName: "status", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "jobId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "gsi2",
          KeySchema: [
            { AttributeName: "status", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_schedules",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "scheduleId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "scheduleId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_reviews",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "runId", AttributeType: "S" },
        { AttributeName: "reviewId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "runId", KeyType: "HASH" },
            { AttributeName: "reviewId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_section_overrides",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "runId", AttributeType: "S" },
        { AttributeName: "overrideId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "runId", KeyType: "HASH" },
            { AttributeName: "overrideId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_knowledge_base",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "kbId", AttributeType: "S" },
        { AttributeName: "sourceType", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "kbId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "gsi2",
          KeySchema: [
            { AttributeName: "sourceType", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_narrative_sections",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "runId", AttributeType: "S" },
        { AttributeName: "narrativeId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "runId", KeyType: "HASH" },
            { AttributeName: "narrativeId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_report_csv_profiles",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organizationName", AttributeType: "S" },
        { AttributeName: "profileId", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "organizationName", KeyType: "HASH" },
            { AttributeName: "profileId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },

    {
      name: "FastBI_PayPal_payment_methods",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "paypal_order_id", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "idx_paypal_order_id",
          KeySchema: [
            { AttributeName: "paypal_order_id", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FastBI_PayPal_orders",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
        { AttributeName: "status", AttributeType: "S" },
        { AttributeName: "processing_status", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "idx_organization_id",
          KeySchema: [
            { AttributeName: "organization_id", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "idx_status",
          KeySchema: [
            { AttributeName: "status", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "idx_processing_status",
          KeySchema: [
            { AttributeName: "processing_status", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FastBI_PayPal_captures",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
        { AttributeName: "status", AttributeType: "S" },
        { AttributeName: "capture_id", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "idx_capture_id",
          KeySchema: [
            { AttributeName: "capture_id", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "idx_organization_id",
          KeySchema: [
            { AttributeName: "organization_id", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: "idx_status",
          KeySchema: [
            { AttributeName: "status", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FastBI_PayPal_customers",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "email", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "idx_email",
          KeySchema: [
            { AttributeName: "email", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
    {
      name: "FASTBI_organization_licenses",
      keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      attributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "organization_id", AttributeType: "S" },
      ],
      globalSecondaryIndexes: [
        {
          IndexName: "idx_organization_id",
          KeySchema: [
            { AttributeName: "organization_id", KeyType: "HASH" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    },
  ];

  for (const table of tablesWithoutGSI) {
    await ensureTable(
      table.name,
      table.keySchema,
      table.attributeDefinitions
    );
  }

  for (const table of tablesWithGSI) {
    await ensureTable(
      table.name,
      table.keySchema,
      table.attributeDefinitions,
      table.globalSecondaryIndexes
    );
  }

  console.log("\nAll tables processed.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});