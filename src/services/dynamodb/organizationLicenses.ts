import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export const ORGANIZATION_LICENSES_TABLE =
  process.env.DYNAMODB_ORGANIZATION_LICENSES_TABLE || "FASTBI_organization_licenses";

export interface OrganizationLicense {
  id: string;
  organization_id: string;
  plan_key: string;
  user_quantity: number;
  billing_cycle: "monthly" | "annual";
  created_at: string;
  updated_at: string;
}

export async function getLicenseByOrganizationId(
  organizationId: string
): Promise<OrganizationLicense | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ORGANIZATION_LICENSES_TABLE,
        Key: { organization_id: organizationId },
      })
    );
    const item = result.Item;
    if (!item) return null;
    return {
      id: String(item.id || ""),
      organization_id: String(item.organization_id),
      plan_key: String(item.plan_key),
      user_quantity: Number(item.user_quantity || 0),
      billing_cycle: item.billing_cycle === "annual" ? "annual" : "monthly",
      created_at: String(item.created_at || ""),
      updated_at: String(item.updated_at || ""),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[organizationLicenses] get failed for org ${organizationId}: ${message}`);
    return null;
  }
}

export async function upsertOrganizationLicense(
  license: OrganizationLicense
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: ORGANIZATION_LICENSES_TABLE,
      Item: license,
    })
  );
}