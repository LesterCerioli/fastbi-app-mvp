"use client";

import { useEffect, useRef, useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { CreditCard, ListChecks, AlertTriangle, Loader2 } from "lucide-react";

interface AdminLastPayment {
  amount: number;
  currency: string;
  created_at: string;
}

interface AdminSubscription {
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

interface AdminSubscriptionsOverview {
  subscriptions: AdminSubscription[];
  overdue_count: number;
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

function statusTone(status: string, isOverdue: boolean) {
  if (isOverdue) return "danger";
  if (status === "active") return "success";
  if (status === "trialing") return "neutral";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "warning";
  return "neutral";
}

export default function SubscriptionOverview() {
  const { t } = useTranslations();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<AdminSubscriptionsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      let storedUser: { email?: string; role?: string } | null = null;
      try {
        storedUser = JSON.parse(sessionStorage.getItem("user") || "null");
      } catch {
        storedUser = null;
      }

      if (!storedUser || storedUser.role !== "FastBI Admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const r = await fetch(
          `/api/admin/subscriptions?email=${encodeURIComponent(storedUser?.email || "")}`,
          { headers }
        );
        if (r.status === 401 || r.status === 403) {
          setError(t("adminSubscriptions.accessDenied"));
          return;
        }
        if (!r.ok) {
          setError(t("adminSubscriptions.loadError"));
          return;
        }
        const data = await r.json();
        setOverview(data);
      } catch {
        setError(t("adminSubscriptions.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  if (loading) {
    return (
      <S.LoadingState>
        <Loader2 size={18} className="spin" />
        {t("adminSubscriptions.loading")}
      </S.LoadingState>
    );
  }

  if (isAdmin === false || !overview) {
    return null;
  }

  const subscriptions = overview?.subscriptions || [];
  const overdue = subscriptions.filter((s) => s.is_overdue);

  return (
    <>
      {error && (
        <S.Card>
          <S.EmptyState>{error}</S.EmptyState>
        </S.Card>
      )}

        <S.Card>
          <S.SectionTitle>
            <CreditCard size={18} />
            {t("adminSubscriptions.section1Title")}
          </S.SectionTitle>

          {subscriptions.length === 0 ? (
            <S.EmptyState>{t("adminSubscriptions.noSubscriptions")}</S.EmptyState>
          ) : (
            <S.Table>
              <S.TableHeader>
                <span>{t("adminSubscriptions.organization")}</span>
                <span>{t("adminSubscriptions.plan")}</span>
                <span>{t("adminSubscriptions.cycle")}</span>
                <span>{t("adminSubscriptions.amount")}</span>
                <span>{t("adminSubscriptions.nextCharge")}</span>
              </S.TableHeader>
              {subscriptions.map((s) => (
                <S.TableRow key={s.id}>
                  <S.OrgName>{s.organization_name}</S.OrgName>
                  <span>{s.plan_key || "-"}</span>
                  <span>{s.billing_cycle || "-"}</span>
                  <span>{formatCurrency(s.amount_cents / 100, s.currency)}</span>
                  <span>{s.next_charge_at ? formatDate(s.next_charge_at) : "-"}</span>
                </S.TableRow>
              ))}
            </S.Table>
          )}
        </S.Card>

        <S.Card>
          <S.SectionTitle>
            <ListChecks size={18} />
            {t("adminSubscriptions.section2Title")}
          </S.SectionTitle>

          {subscriptions.length === 0 ? (
            <S.EmptyState>{t("adminSubscriptions.noSubscriptions")}</S.EmptyState>
          ) : (
            <S.Table>
              <S.TableHeader>
                <span>{t("adminSubscriptions.organization")}</span>
                <span>{t("adminSubscriptions.status")}</span>
                <span>{t("adminSubscriptions.lastPayment")}</span>
                <span>{t("adminSubscriptions.nextCharge")}</span>
                <span>{t("adminSubscriptions.endsAtPeriodEnd")}</span>
              </S.TableHeader>
              {subscriptions.map((s) => (
                <S.TableRow key={s.id}>
                  <S.OrgName>{s.organization_name}</S.OrgName>
                  <S.StatusBadge $tone={statusTone(s.status, s.is_overdue)}>
                    {s.status || "-"}
                  </S.StatusBadge>
                  <span>
                    {s.last_payment
                      ? `${formatCurrency(s.last_payment.amount / 100, s.last_payment.currency)} (${formatDate(s.last_payment.created_at)})`
                      : "-"}
                  </span>
                  <span>{s.next_charge_at ? formatDate(s.next_charge_at) : "-"}</span>
                  <span>{s.cancel_at_period_end ? t("adminSubscriptions.yes") : t("adminSubscriptions.no")}</span>
                </S.TableRow>
              ))}
            </S.Table>
          )}
        </S.Card>

        <S.Card>
          <S.SectionTitle>
            <AlertTriangle size={18} />
            {t("adminSubscriptions.section3Title")}
            {overdue.length > 0 && <S.OverdueCount>{overdue.length}</S.OverdueCount>}
          </S.SectionTitle>

          {overdue.length === 0 ? (
            <S.EmptyState>{t("adminSubscriptions.noOverdue")}</S.EmptyState>
          ) : (
            <S.Table>
              <S.TableHeader>
                <span>{t("adminSubscriptions.organization")}</span>
                <span>{t("adminSubscriptions.plan")}</span>
                <span>{t("adminSubscriptions.amount")}</span>
                <span>{t("adminSubscriptions.nextCharge")}</span>
                <span>{t("adminSubscriptions.status")}</span>
              </S.TableHeader>
              {overdue.map((s) => (
                <S.TableRow key={s.id}>
                  <S.OrgName>{s.organization_name}</S.OrgName>
                  <span>{s.plan_key || "-"}</span>
                  <span>{formatCurrency(s.amount_cents / 100, s.currency)}</span>
                  <span>{s.next_charge_at ? formatDate(s.next_charge_at) : "-"}</span>
                  <S.StatusBadge $tone="danger">
                    {t("adminSubscriptions.overdue")}
                  </S.StatusBadge>
                </S.TableRow>
              ))}
            </S.Table>
          )}
        </S.Card>
    </>
  );
}
