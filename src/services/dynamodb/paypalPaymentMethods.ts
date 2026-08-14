import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
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

const PAYMENT_METHODS_TABLE = "FastBI_PayPal_payment_methods";

export interface PayPalPaymentMethod {
  id: string;
  paypal_order_id: string;
  type?: string;
  card_brand?: string;
  card_last_digits?: string;
  card_expiry?: string;
  cardholder_name?: string;
  billing_address?: string;
  vault_id?: string;
  vault_status?: string;
  response_json?: string;
  created_at: string;
  updated_at: string;
}

export async function savePayPalPaymentMethod(
  paymentMethod: PayPalPaymentMethod
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: PAYMENT_METHODS_TABLE,
      Item: paymentMethod,
    })
  );
}

export async function getPayPalPaymentMethodById(
  id: string
): Promise<PayPalPaymentMethod | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PAYMENT_METHODS_TABLE,
      Key: { id },
    })
  );
  return (result.Item as PayPalPaymentMethod) || null;
}

export async function getPayPalPaymentMethodsByOrderId(
  paypalOrderId: string
): Promise<PayPalPaymentMethod[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: PAYMENT_METHODS_TABLE,
      IndexName: "idx_paypal_order_id",
      KeyConditionExpression: "paypal_order_id = :oid",
      ExpressionAttributeValues: { ":oid": paypalOrderId },
    })
  );
  return (result.Items || []) as PayPalPaymentMethod[];
}