import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
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

export const PAYPAL_ORDERS_TABLE = "FastBI_PayPal_orders";

export interface PayPalOrder {
  id: string;
  paypal_order_id: string;
  organization_id?: string;
  payment_method_id?: string;
  user_email: string;
  plan_key?: string;
  billing_cycle?: string;
  user_quantity?: number;
  amount?: number;
  currency?: string;
  intent?: string;
  status?: string;
  processing_status?: string;
  payer_id?: string;
  payer_email?: string;
  purchase_units?: string;
  links?: string;
  request_json?: string;
  response_json?: string;
  created_at: string;
  updated_at: string;
}

export async function savePayPalOrder(order: PayPalOrder): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: PAYPAL_ORDERS_TABLE,
      Item: order,
    })
  );
}

export async function getPayPalOrderById(
  id: string
): Promise<PayPalOrder | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PAYPAL_ORDERS_TABLE,
      Key: { id },
    })
  );
  return (result.Item as PayPalOrder) || null;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  processingStatus: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: PAYPAL_ORDERS_TABLE,
      Key: { id },
      UpdateExpression: "SET #status = :status, processing_status = :ps, updated_at = :ua",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":ps": processingStatus,
        ":ua": new Date().toISOString(),
      },
    })
  );
}