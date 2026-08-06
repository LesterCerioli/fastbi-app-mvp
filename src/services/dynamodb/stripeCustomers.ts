import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const CUSTOMERS_TABLE = "FASTBI_stripe_customers";

export interface StripeCustomer {
  id: string;
  organization_id?: string;
  stripe_customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export async function saveCustomer(customer: StripeCustomer): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: CUSTOMERS_TABLE,
      Item: customer,
    })
  );
}