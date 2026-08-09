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
const SUBSCRIPTIONS_TABLE = "FASTBI_stripe_subscriptions";
const INTENTS_TABLE = "FASTBI_payment_intents";

export interface AdminLastPayment {
  amount: number;
  currency: string;
  created_at: string;
}

export interface AdminSubscription {
  id: string;
  stripe_subscription_id: string;
  organization_id: string;
  organization_name: string;
  plan_key: string;
  billing_cycle: string;
  amount_cents: number;
  currency: string;
  status: string;
  cancel_at_period_end: boolean;
  next_charge_at: string | null;
  created_at: string;
  last_payment: AdminLastPayment | null;
  is_overdue: boolean;
}

export interface AdminSubscriptionsOverview {
  subscriptions: AdminSubscription[];
  overdue_count: number;
}

async function scanTable(
  tableName: string,
  projectionExpression?: string,
  expressionAttributeNames?: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ...(projectionExpression
          ? { ProjectionExpression: projectionExpression }
          : {}),
        ...(expressionAttributeNames
          ? { ExpressionAttributeNames: expressionAttributeNames }
          : {}),
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    for (const item of result.Items || []) {
      items.push(item);
    }
    lastEvaluatedKey = (result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined);
  } while (lastEvaluatedKey);
  return items;
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
        IndexName: "idx_processing_status",
        KeyConditionExpression: "processing_status = :status",
        ExpressionAttributeValues: { ":status": "paid" },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    for (const item of result.Items || []) {
      if (
        typeof item.payment_method_id === "string" &&
        pmSet.has(item.payment_method_id)
      ) {
        intents.push(item);
      }
    }
    lastEvaluatedKey = (result.LastEvaluatedKey as
      | Record<string, unknown>
      | undefined);
  } while (lastEvaluatedKey);
  return intents;
}

export async function getAdminSubscriptionsOverview(): Promise<AdminSubscriptionsOverview> {
  const [subscriptionItems, organizationItems] = await Promise.all([
    scanTable(SUBSCRIPTIONS_TABLE),
    scanTable(ORGANIZATIONS_TABLE, "id, #name", { "#name": "name" }),
  ]);

  const organizationNameById = new Map<string, string>();
  for (const item of organizationItems) {
    if (typeof item.id === "string" && typeof item.name === "string") {
      organizationNameById.set(item.id, item.name);
    }
  }

  const activeSubscriptions = subscriptionItems.filter((s) => !s.deleted_at);

  const paymentMethodIds = Array.from(
    new Set(
      activeSubscriptions
        .map((s) => s.payment_method_id)
        .filter((v): v is string => typeof v === "string")
    )
  );

  const intentItems = await getPaidIntentsByPaymentMethodIds(paymentMethodIds);

  const latestPaymentByPm = new Map<string, AdminLastPayment>();
  for (const intent of intentItems) {
    const pmId = intent.payment_method_id;
    if (typeof pmId !== "string") continue;
    const createdAt = String(intent.created_at || "");
    const existing = latestPaymentByPm.get(pmId);
    if (!existing || (createdAt && createdAt > existing.created_at)) {
      latestPaymentByPm.set(pmId, {
        amount: Number(intent.amount || 0),
        currency: String(intent.currency || "usd"),
        created_at: createdAt,
      });
    }
  }

  const nowIso = new Date().toISOString();

  const subscriptions: AdminSubscription[] = activeSubscriptions.map((s) => {
    const billingAnchorUnix = Number(s.billing_anchor_unix || 0);
    const nextChargeAt =
      billingAnchorUnix > 0
        ? new Date(billingAnchorUnix * 1000).toISOString()
        : null;

    const paymentMethodId = String(s.payment_method_id || "");
    const lastPayment = paymentMethodId
      ? latestPaymentByPm.get(paymentMethodId) || null
      : null;

    const hasOverdueStatus =
      String(s.status || "") === "past_due" ||
      String(s.status || "") === "unpaid" ||
      String(s.status || "") === "incomplete";

    const chargePassedWithoutPayment =
      nextChargeAt !== null &&
      nextChargeAt < nowIso &&
      (!lastPayment || lastPayment.created_at < nextChargeAt);

    const isOverdue = hasOverdueStatus || chargePassedWithoutPayment;

    return {
      id: String(s.id || ""),
      stripe_subscription_id: String(s.stripe_subscription_id || ""),
      organization_id: String(s.organization_id || ""),
      organization_name:
        organizationNameById.get(String(s.organization_id || "")) || "-",
      plan_key: String(s.plan_key || ""),
      billing_cycle: String(s.billing_cycle || ""),
      amount_cents: Number(s.amount_cents || 0),
      currency: String(s.currency || "usd"),
      status: String(s.status || ""),
      cancel_at_period_end: Boolean(s.cancel_at_period_end),
      next_charge_at: nextChargeAt,
      created_at: String(s.created_at || ""),
      last_payment: lastPayment,
      is_overdue: isOverdue,
    };
  });

  subscriptions.sort((a, b) => a.organization_name.localeCompare(b.organization_name));

  return {
    subscriptions,
    overdue_count: subscriptions.filter((s) => s.is_overdue).length,
  };
}
