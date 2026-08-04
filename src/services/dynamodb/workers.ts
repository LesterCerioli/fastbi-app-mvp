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

const TABLE_NAME = process.env.DYNAMODB_WORKERS_TABLE || "FASTBI_workers";

export interface WorkerRecord {
  id: string;
  organization_id: string;
  worker_id: string;
  workflow_id: string;
  step_name: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export async function createWorker(worker: WorkerRecord): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: worker,
    })
  );
}

export async function getWorkerById(id: string): Promise<WorkerRecord | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id } })
  );
  return (result.Item as WorkerRecord) || null;
}

export async function getWorkersByWorkflow(workflowId: string): Promise<WorkerRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "organization_id = :oid",
      FilterExpression: "workflow_id = :wid",
      ExpressionAttributeValues: { ":oid": workflowId, ":wid": workflowId },
    })
  );
  return (result.Items as WorkerRecord[]) || [];
}

export async function updateWorkerStatus(id: string, status: string, result: Record<string, unknown> | null, error: string | null): Promise<void> {
  const updateExpression: string[] = ["SET #status = :status", "updated_at = :now"];
  const expressionAttributeValues: Record<string, unknown> = {
    ":status": status,
    ":now": new Date().toISOString(),
  };
  const expressionAttributeNames: Record<string, string> = { "#status": "status" };

  if (result !== null && result !== undefined) {
    updateExpression.push("result = :result");
    expressionAttributeValues[":result"] = result;
  }
  if (error !== null && error !== undefined) {
    updateExpression.push("error = :error");
    expressionAttributeValues[":error"] = error;
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

export async function listWorkersByOrganization(organizationId: string): Promise<WorkerRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "organization_id = :oid",
      ExpressionAttributeValues: { ":oid": organizationId },
    })
  );
  return (result.Items as WorkerRecord[]) || [];
}