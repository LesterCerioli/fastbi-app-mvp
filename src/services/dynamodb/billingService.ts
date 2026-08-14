import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
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

const ORGANIZATIONS_TABLE =
  process.env.DYNAMODB_ORGANIZATIONS_TABLE || "FASTBI_ORGANIZATIONS";
const CUSTOMERS_TABLE = "FastBI_PayPal_customers";
const SUBSCRIPTIONS_TABLE = "FastBI_PayPal_orders";
const INTENTS_TABLE = "FastBI_PayPal_captures";

export class BillingOrganizationNotFoundError extends Error {
  constructor(organizationName: string) {
    super(`organization not found for name '${organizationName}'`);
    this.name = "BillingOrganizationNotFoundError";
  }
}

export interface PaymentSummary {
  id: string;
  payment_intent_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface NextCharge {
  subscription_id: string;
  stripe_subscription_id: string;
  plan_key: string;
  billing_cycle: string;
  amount_cents: number;
  currency: string;
  status: string;
  cancel_at_period_end: boolean;
  next_charge_at: string | null;
}

export interface BillingOverview {
  organization_name: string;
  organization_ids: string[];
  payments: PaymentSummary[];
  next_charge: NextCharge | null;
}

async function resolveOrganizationIdsByName(
  organizationName: string
): Promise<string[]> {
  const target = organizationName.trim().toLowerCase();
  const matchedIds: string[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: ORGANIZATIONS_TABLE,
        ProjectionExpression: "id, #name",
        ExpressionAttributeNames: { "#name": "name" },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of result.Items || []) {
      if (typeof item.id !== "string") continue;
      if (typeof item.name === "string" && item.name.trim().toLowerCase() === target) {
        matchedIds.push(item.id);
      }
    }
    lastEvaluatedKey = (result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined);
  } while (lastEvaluatedKey);

  if (matchedIds.length === 0) {
    throw new BillingOrganizationNotFoundError(organizationName);
  }
  return matchedIds;
}

async function getSubscriptionsByOrganizationIds(
  organizationIds: string[]
): Promise<Record<string, unknown>[]> {
  const subscriptions: Record<string, unknown>[] = [];
  for (const orgId of organizationIds) {
    let lastEvaluatedKey: Record<string, unknown> | undefined;
    do {
      const result = await docClient.send(
        new QueryCommand({
          TableName: SUBSCRIPTIONS_TABLE,
          IndexName: "idx_organization_id",
          KeyConditionExpression: "organization_id = :orgId",
          ExpressionAttributeValues: { ":orgId": orgId },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
      for (const item of result.Items || []) {
        if (!item.deleted_at) {
          subscriptions.push(item);
        }
      }
      lastEvaluatedKey = (result.LastEvaluatedKey as
        | Record<string, unknown>
        | undefined);
    } while (lastEvaluatedKey);
  }
  return subscriptions;
}

async function getPaidIntentsByPaymentMethodIds(
  paymentMethodIds: string[]
): Promise<Record<string, unknown>[]> {
  if (paymentMethodIds.length === 0) return [];
  const pmSet = new Set(paymentMethodIds);
  const intents: Record<string, unknown>[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: INTENTS_TABLE,
        IndexName: "idx_status",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": "COMPLETED" },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    for (const item of result.Items || []) {
      if (typeof item.payment_method_id === "string" && pmSet.has(item.payment_method_id)) {
        intents.push(item);
      }
    }
    lastEvaluatedKey = (result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined);
  } while (lastEvaluatedKey);
  return intents;
}

async function getOrganizationIdsByCustomerEmail(
  customerEmail: string
): Promise<string[]> {
  const target = customerEmail.trim().toLowerCase();
  const matchedIds: string[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: CUSTOMERS_TABLE,
        FilterExpression: "#em = :email",
        ExpressionAttributeNames: { "#em": "email" },
        ExpressionAttributeValues: { ":email": target },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    for (const item of result.Items || []) {
      if (
        typeof item.organization_id === "string" &&
        item.organization_id.trim().length > 0
      ) {
        matchedIds.push(item.organization_id);
      }
    }
    lastEvaluatedKey = (result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined);
  } while (lastEvaluatedKey);
  return Array.from(new Set(matchedIds));
}

function deriveNextChargeAt(item: Record<string, unknown>): string | null {
  if (typeof item.next_charge_at === "string" && item.next_charge_at) {
    return item.next_charge_at;
  }
  const createdAt = String(item.created_at || "");
  if (!createdAt || createdAt === "0001-01-01T00:00:00Z") return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  const days = String(item.billing_cycle || "").toLowerCase() === "annual" ? 365 : 30;
  created.setUTCDate(created.getUTCDate() + days);
  return created.toISOString();
}

export async function getBillingOverview(
  organizationName: string,
  customerEmail?: string
): Promise<BillingOverview> {
  let organizationIds: string[] = [];
  if (customerEmail && customerEmail.trim()) {
    organizationIds = await getOrganizationIdsByCustomerEmail(customerEmail);
  }
  if (organizationIds.length === 0) {
    organizationIds = await resolveOrganizationIdsByName(organizationName);
  }

  const subscriptions = await getSubscriptionsByOrganizationIds(organizationIds);

  const paymentMethodIds = Array.from(
    new Set(
      subscriptions
        .map((s) => s.payment_method_id)
        .filter((v): v is string => typeof v === "string")
    )
  );

  const intentItems = await getPaidIntentsByPaymentMethodIds(paymentMethodIds);

  const paymentByPm = new Map<string, Record<string, unknown>>();
  for (const intent of intentItems) {
    const pmId = intent.payment_method_id;
    if (typeof pmId === "string") {
      const existing = paymentByPm.get(pmId);
      const createdAt = String(intent.created_at || "");
      if (!existing || (createdAt && String(existing.created_at || "") < createdAt)) {
        paymentByPm.set(pmId, intent);
      }
    }
  }

  const payments: PaymentSummary[] = intentItems.map((item) => ({
    id: String(item.id || ""),
    payment_intent_id: String(item.capture_id || item.payment_intent_id || ""),
    payment_method_id: String(item.payment_method_id || ""),
    amount: Number(item.amount || 0),
    currency: String(item.currency || "usd"),
    status: String(item.status || "COMPLETED"),
    created_at: String(item.created_at || ""),
  }));
  payments.sort((a, b) => b.created_at.localeCompare(a.created_at));

  let next_charge: NextCharge | null = null;
  const sortedSubscriptions = [...subscriptions].sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || ""))
  );
  if (sortedSubscriptions.length > 0) {
    const sub = sortedSubscriptions[0];
    const quantity = Number(sub.user_quantity || sub.quantity || 1);
    next_charge = {
      subscription_id: String(sub.id || ""),
      stripe_subscription_id: String(sub.paypal_order_id || ""),
      plan_key: String(sub.plan_key || ""),
      billing_cycle: String(sub.billing_cycle || ""),
      amount_cents: Math.round(Number(sub.amount || 0) * 100) * quantity,
      currency: String(sub.currency || "usd"),
      status: String(sub.status || ""),
      cancel_at_period_end: false,
      next_charge_at: deriveNextChargeAt(sub),
    };
  }

  return {
    organization_name: organizationName,
    organization_ids: organizationIds,
    payments,
    next_charge,
  };
}