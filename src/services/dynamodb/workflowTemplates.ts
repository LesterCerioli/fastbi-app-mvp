import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_WORKFLOW_TEMPLATES_TABLE || "FASTBI_workflow_templates";

export interface WorkflowTemplateRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  definition: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createWorkflowTemplate(template: WorkflowTemplateRecord): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: template,
    })
  );
}

export async function getWorkflowTemplateById(id: string): Promise<WorkflowTemplateRecord | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id } })
  );
  return (result.Item as WorkflowTemplateRecord) || null;
}

export async function updateWorkflowTemplate(id: string, updates: Partial<WorkflowTemplateRecord>): Promise<void> {
  const updateExpression: string[] = ["SET updated_at = :now"];
  const expressionAttributeValues: Record<string, unknown> = { ":now": new Date().toISOString() };
  const expressionAttributeNames: Record<string, string> = {};

  if (updates.name !== undefined) {
    updateExpression.push("#name = :name");
    expressionAttributeValues[":name"] = updates.name;
    expressionAttributeNames["#name"] = "name";
  }
  if (updates.description !== undefined) {
    updateExpression.push("#desc = :desc");
    expressionAttributeValues[":desc"] = updates.description;
    expressionAttributeNames["#desc"] = "description";
  }
  if (updates.category !== undefined) {
    updateExpression.push("#cat = :cat");
    expressionAttributeValues[":cat"] = updates.category;
    expressionAttributeNames["#cat"] = "category";
  }
  if (updates.definition !== undefined) {
    updateExpression.push("definition = :definition");
    expressionAttributeValues[":definition"] = updates.definition;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression.join(", "),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    })
  );
}

export async function listWorkflowTemplatesByOrganization(organizationId: string): Promise<WorkflowTemplateRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "organization_id = :oid",
      ExpressionAttributeValues: { ":oid": organizationId },
    })
  );
  return (result.Items as WorkflowTemplateRecord[]) || [];
}

export async function deleteWorkflowTemplate(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );
}