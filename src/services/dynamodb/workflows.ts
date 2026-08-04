import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_WORKFLOWS_TABLE || "FASTBI_workflows";

export interface WorkflowStep {
  step_id: string;
  step_name: string;
  step_type: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  status: string;
  order: number;
}

export interface WorkflowRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  definition: Record<string, unknown>;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export async function createWorkflow(workflow: WorkflowRecord): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: workflow,
    })
  );
}

export async function getWorkflowById(id: string): Promise<WorkflowRecord | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id } })
  );
  return (result.Item as WorkflowRecord) || null;
}

export async function updateWorkflow(id: string, updates: Partial<WorkflowRecord>): Promise<void> {
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
  if (updates.status !== undefined) {
    updateExpression.push("#status = :status");
    expressionAttributeValues[":status"] = updates.status;
    expressionAttributeNames["#status"] = "status";
  }
  if (updates.definition !== undefined) {
    updateExpression.push("definition = :definition");
    expressionAttributeValues[":definition"] = updates.definition;
  }
  if (updates.steps !== undefined) {
    updateExpression.push("steps = :steps");
    expressionAttributeValues[":steps"] = updates.steps;
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

export async function listWorkflowsByOrganization(organizationId: string): Promise<WorkflowRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "organization_id = :oid",
      ExpressionAttributeValues: { ":oid": organizationId },
    })
  );
  return (result.Items as WorkflowRecord[]) || [];
}

export async function deleteWorkflow(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET #status = :status, updated_at = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": "deleted", ":now": new Date().toISOString() },
    })
  );
}