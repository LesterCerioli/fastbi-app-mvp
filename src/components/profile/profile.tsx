"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { jsPDF } from "jspdf";
import { Camera, Download, FileText, CreditCard, Loader2 } from "lucide-react";

interface UserData {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface PaymentSummary {
  id: string;
  payment_intent_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface NextCharge {
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

interface BillingOverview {
  organization_name: string;
  organization_ids: string[];
  payments: PaymentSummary[];
  next_charge: NextCharge | null;
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

export default function Profile() {
  const { t } = useTranslations();
  const [user, setUser] = useState<UserData | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
    setOrganizationName(sessionStorage.getItem("organization_name") || "");
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const r = await fetch(`/api/users/avatar?userId=${userId}`, { headers });
        const data = await r.json();
        if (!cancelled && data.avatar_url) setAvatarUrl(data.avatar_url);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      let storedUser: { email?: string } | null = null;
      try {
        storedUser = JSON.parse(sessionStorage.getItem("user") || "null");
      } catch {
        storedUser = null;
      }
      const customerEmail = storedUser?.email || "";
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(
        `/api/billing/overview?email=${encodeURIComponent(customerEmail)}`,
        { headers }
      );
      if (r.status === 404) {
        setBilling(null);
        return;
      }
      if (!r.ok) return;
      const data = await r.json();
      setBilling(data);
    } catch {
      /* ignore */
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    setMessage(null);

    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const res = await fetch("/api/users/avatar", { method: "POST", headers, body: formData });
      const data = await res.json();

      if (res.ok) {
        setAvatarUrl(data.avatar_url);
        setMessage({ text: t("profile.avatar.uploaded") });
      } else {
        setMessage({ text: data.error || t("profile.avatar.error"), error: true });
      }
    } catch {
      setMessage({ text: t("profile.avatar.error"), error: true });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDownloadInvoice = (payment: PaymentSummary, organizationNameFallback: string) => {
    const doc = new jsPDF();

    doc.setFillColor(10, 26, 20);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FastBI", 14, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(t("profile.billing.invoice"), 14, 28);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(t("profile.billing.invoice"), 14, 48);

    const invoiceNumber = payment.payment_intent_id || payment.id || "-";
    const rows: Array<[string, string]> = [
      [t("profile.billing.invoice") + " #", invoiceNumber],
      [t("profile.organization"), organizationNameFallback || "-"],
      [t("profile.billing.date"), payment.created_at ? formatDate(payment.created_at) : "-"],
      [t("profile.billing.status"), t("profile.billing.paid")],
      [t("profile.billing.amount"), formatCurrency(payment.amount / 100, payment.currency)],
    ];

    let y = 60;
    doc.setFontSize(11);
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(label, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(value, 70, y);
      y += 8;
    });

    doc.setDrawColor(210, 210, 210);
    doc.line(14, y + 4, 196, y + 4);

    doc.save(`${payment.payment_intent_id || "invoice"}.pdf`);
  };

  const initials = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <S.Wrapper>
      <S.Container>
        <S.Title>{t("profile.title")}</S.Title>

        <S.Card>
          <S.ProfileSection>
            <S.AvatarSection>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <S.Avatar src={avatarUrl} alt="Avatar" />
              ) : (
                <S.AvatarPlaceholder>{initials}</S.AvatarPlaceholder>
              )}
              <S.UploadBtn onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
                {uploading ? t("profile.avatar.uploading") : t("profile.avatar.upload")}
              </S.UploadBtn>
              <S.FileInput
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </S.AvatarSection>

            <S.DataSection>
              <S.FieldGroup>
                <S.Label>{t("profile.name")}</S.Label>
                <S.Value>{user?.name || "-"}</S.Value>
              </S.FieldGroup>
              <S.FieldGroup>
                <S.Label>{t("profile.email")}</S.Label>
                <S.Value>{user?.email || "-"}</S.Value>
              </S.FieldGroup>
              <S.FieldGroup>
                <S.Label>{t("profile.organization")}</S.Label>
                <S.Value>{organizationName || "-"}</S.Value>
              </S.FieldGroup>
            </S.DataSection>
          </S.ProfileSection>

          {message && <S.Message $error={message.error}>{message.text}</S.Message>}
        </S.Card>

        <S.Card>
          <S.SectionTitle>
            <CreditCard size={18} />
            {t("profile.billing.title")}
          </S.SectionTitle>

          {billingLoading ? (
            <S.EmptyState>
              <Loader2 size={18} className="spin" />
              {t("profile.billing.loading")}
            </S.EmptyState>
          ) : billing && billing.next_charge ? (
            <S.NextChargeCard>
              <S.NextChargeLabel>{t("profile.billing.nextCharge")}</S.NextChargeLabel>
              <S.NextChargeAmount>
                {formatCurrency(billing.next_charge.amount_cents / 100, billing.next_charge.currency)}
              </S.NextChargeAmount>
              <S.NextChargeDetails>
                <S.MetaItem>
                  <S.MetaLabel>{t("profile.billing.plan")}</S.MetaLabel>
                  <span>{billing.next_charge.plan_key || "-"}</span>
                </S.MetaItem>
                <S.MetaItem>
                  <S.MetaLabel>{t("profile.billing.cycle")}</S.MetaLabel>
                  <span>{billing.next_charge.billing_cycle || "-"}</span>
                </S.MetaItem>
                <S.MetaItem>
                  <S.MetaLabel>{t("profile.billing.dueDate")}</S.MetaLabel>
                  <span>
                    {billing.next_charge.next_charge_at
                      ? formatDate(billing.next_charge.next_charge_at)
                      : "-"}
                  </span>
                </S.MetaItem>
              </S.NextChargeDetails>
            </S.NextChargeCard>
          ) : (
            <S.EmptyState>{t("profile.billing.noSubscription")}</S.EmptyState>
          )}

          <S.SectionSubtitle>{t("profile.billing.paidInvoices")}</S.SectionSubtitle>

          {billing && billing.payments.length > 0 ? (
            <S.InvoiceList>
              <S.InvoiceHeader>
                <span>{t("profile.billing.date")}</span>
                <span>{t("profile.billing.amount")}</span>
                <span>{t("profile.billing.status")}</span>
                <span />
              </S.InvoiceHeader>
              {billing.payments.map((p) => (
                <S.InvoiceRow key={p.id}>
                  <span>{formatDate(p.created_at)}</span>
                  <span>{formatCurrency(p.amount / 100, p.currency)}</span>
                  <S.StatusBadge>{t("profile.billing.paid")}</S.StatusBadge>
                  <S.DownloadBtn onClick={() => handleDownloadInvoice(p, billing.organization_name)}>
                    <Download size={14} />
                    {t("profile.billing.download")}
                  </S.DownloadBtn>
                </S.InvoiceRow>
              ))}
            </S.InvoiceList>
          ) : (
            <S.EmptyState>
              <FileText size={18} />
              {t("profile.billing.noInvoices")}
            </S.EmptyState>
          )}
        </S.Card>
      </S.Container>
    </S.Wrapper>
  );
}