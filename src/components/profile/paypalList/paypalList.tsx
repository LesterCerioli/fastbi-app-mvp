"use client";

import { useEffect, useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { CreditCard, ListChecks, Loader2, RefreshCw } from "lucide-react";

interface GoSubscription {
  id: string;
  organization_name: string;
  plan_key: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  subscription_status?: string;
  status: string;
  created_at: string;
}

interface GoPayment {
  capture_id: string;
  organization_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

async function getFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch {
    return null;
  }
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(value);
  } catch {
    return `${(currency || "usd").toUpperCase()} ${value.toFixed(2)}`;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusTone(status: string): string {
  if (status === "active" || status === "COMPLETED") return "success";
  if (status === "canceled" || status === "unpaid") return "danger";
  if (status === "past_due" || status === "incomplete") return "warning";
  return "neutral";
}

export default function PayPalList() {
  const { t } = useTranslations();
  const [subscriptions, setSubscriptions] = useState<GoSubscription[]>([]);
  const [payments, setPayments] = useState<GoPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [subRes, payRes] = await Promise.all([
        fetch("/api/billing/subscriptions/list", { headers }),
        fetch("/api/billing/payments", { headers }),
      ]);

      if (subRes.status === 401 || payRes.status === 401) {
        setError("NOT AUTHORIZED");
        return;
      }
      if (!subRes.ok) {
        setError((await subRes.json()).error || "failed to load subscriptions");
        return;
      }
      if (!payRes.ok) {
        setError((await payRes.json()).error || "failed to load payments");
        return;
      }

      setSubscriptions(await subRes.json());
      setPayments(await payRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <S.Wrapper>
      <S.Card>
        <S.SectionTitle>
          <ListChecks size={18} />
          PayPal Subscriptions
          <RefreshCw
            size={16}
            style={{ marginLeft: "auto", cursor: "pointer", color: "#00D4FF" }}
            onClick={load}
          />
        </S.SectionTitle>

        {loading ? (
          <S.EmptyState>
            <Loader2 size={18} className="spin" />
            {t("profile.billing.loading")}
          </S.EmptyState>
        ) : error ? (
          <S.ErrorBox>{error}</S.ErrorBox>
        ) : subscriptions.length === 0 ? (
          <S.EmptyState>No PayPal subscriptions found</S.EmptyState>
        ) : (
          <S.Table>
            <S.TableHeader>
              <span>Organization</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Created</span>
            </S.TableHeader>
            {subscriptions.map((sub) => (
              <S.TableRow key={sub.id}>
                <S.Cell>
                  <S.CellLabel>Organization</S.CellLabel>
                  {sub.organization_name || "-"}
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Plan</S.CellLabel>
                  {sub.plan_key} ({sub.billing_cycle})
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Amount</S.CellLabel>
                  {formatCurrency(sub.amount, sub.currency)}
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Status</S.CellLabel>
                  <S.StatusBadge $tone={statusTone(sub.subscription_status || sub.status)}>
                    {sub.subscription_status || sub.status}
                  </S.StatusBadge>
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Created</S.CellLabel>
                  {formatDate(sub.created_at)}
                </S.Cell>
              </S.TableRow>
            ))}
          </S.Table>
        )}
      </S.Card>

      <S.Card>
        <S.SectionTitle>
          <CreditCard size={18} />
          PayPal Payments
        </S.SectionTitle>

        {loading ? (
          <S.EmptyState>
            <Loader2 size={18} className="spin" />
            {t("profile.billing.loading")}
          </S.EmptyState>
        ) : error ? (
          <S.ErrorBox>{error}</S.ErrorBox>
        ) : payments.length === 0 ? (
          <S.EmptyState>No PayPal payments received</S.EmptyState>
        ) : (
          <S.Table>
            <S.TableHeader>
              <span>Organization</span>
              <span>Capture</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
            </S.TableHeader>
            {payments.map((pay) => (
              <S.TableRow key={pay.capture_id}>
                <S.Cell>
                  <S.CellLabel>Organization</S.CellLabel>
                  {pay.organization_name || "-"}
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Capture</S.CellLabel>
                  {pay.capture_id}
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Amount</S.CellLabel>
                  {formatCurrency(pay.amount, pay.currency)}
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Status</S.CellLabel>
                  <S.StatusBadge $tone={statusTone(pay.status)}>{pay.status}</S.StatusBadge>
                </S.Cell>
                <S.Cell>
                  <S.CellLabel>Date</S.CellLabel>
                  {formatDate(pay.created_at)}
                </S.Cell>
              </S.TableRow>
            ))}
          </S.Table>
        )}
      </S.Card>
    </S.Wrapper>
  );
}