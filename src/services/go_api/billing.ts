import { getGoApiToken } from "./token";

function getApiBase(): string {
  const base = process.env.FASTBI_GO_BASE_URL;
  if (!base) {
    throw new Error("FASTBI_GO_BASE_URL is not set");
  }
  return base.replace(/\/$/, "");
}

async function getJSON<T>(path: string): Promise<T> {
  const token = await getGoApiToken();
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Go API error (${response.status}) for ${path}: ${errorBody}`);
  }
  return response.json() as Promise<T>;
}

export interface GoSubscription {
  id: string;
  organization_id: string;
  organization_name: string;
  paypal_order_id: string;
  paypal_subscription_id?: string;
  payment_method_id: string;
  user_email?: string;
  plan_key: string;
  billing_cycle: string;
  currency: string;
  amount: number;
  user_quantity: number;
  status: string;
  subscription_status?: string;
  approve_link?: string;
  cancel_at_period_end: boolean;
  last_error?: string;
  next_charge_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface GoPayment {
  capture_id: string;
  paypal_order_id: string;
  organization_id: string;
  organization_name: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export async function listGoSubscriptions(): Promise<GoSubscription[]> {
  return getJSON<GoSubscription[]>("/api/v1/billing/subscriptions/list");
}

export async function listGoPaidPayments(): Promise<GoPayment[]> {
  return getJSON<GoPayment[]>("/api/v1/billing/payments");
}