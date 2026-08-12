import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export const PAYPAL_CAPTURES_TABLE = "FastBI_PayPal_captures";

export interface PayPalCapture {
  id: string;
  capture_id: string;
  paypal_order_id: string;
  organization_id?: string;
  payment_method_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  final_capture?: boolean;
  seller_receivable_breakdown?: string;
  response_json?: string;
  created_at: string;
  updated_at: string;
}

export async function savePayPalCapture(capture: PayPalCapture): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: PAYPAL_CAPTURES_TABLE,
      Item: capture,
    })
  );
}

export async function getPayPalCaptureByCaptureId(
  captureId: string
): Promise<PayPalCapture | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: PAYPAL_CAPTURES_TABLE,
      IndexName: "idx_capture_id",
      KeyConditionExpression: "capture_id = :cid",
      ExpressionAttributeValues: { ":cid": captureId },
    })
  );
  const items = (result.Items || []) as PayPalCapture[];
  return items.length > 0 ? items[0] : null;
}