import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const CUSTOMERS_TABLE = "FastBI_PayPal_customers";

export interface PayPalCustomer {
  id: string;
  organization_id?: string;
  paypal_customer_id?: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export async function findOrCreatePayPalCustomer(
  email: string,
  payerId?: string,
  organizationId?: string
): Promise<PayPalCustomer> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CUSTOMERS_TABLE,
      IndexName: "idx_email",
      KeyConditionExpression: "#em = :email",
      ExpressionAttributeNames: { "#em": "email" },
      ExpressionAttributeValues: {
        ":email": email.trim().toLowerCase(),
      },
    })
  );

  const items = (result.Items || []) as PayPalCustomer[];

  if (items.length > 0) {
    const existing = items[0];
    if (
      (payerId && !existing.paypal_customer_id) ||
      (organizationId && !existing.organization_id)
    ) {
      const updated: PayPalCustomer = {
        ...existing,
        paypal_customer_id: existing.paypal_customer_id || payerId,
        organization_id: existing.organization_id || organizationId,
        updated_at: new Date().toISOString(),
      };
      await docClient.send(
        new PutCommand({
          TableName: CUSTOMERS_TABLE,
          Item: updated,
        })
      );
      return updated;
    }
    return existing;
  }

  const now = new Date().toISOString();
  const customer: PayPalCustomer = {
    id: uuidv4(),
    organization_id: organizationId,
    paypal_customer_id: payerId,
    email: email.trim().toLowerCase(),
    created_at: now,
    updated_at: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: CUSTOMERS_TABLE,
      Item: customer,
    })
  );

  return customer;
}