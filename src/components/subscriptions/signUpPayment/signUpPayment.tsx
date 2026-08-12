"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { SubscriptionData } from "@/components/subscriptions/signUp/signUp";

interface Props {
  subscriptionData: SubscriptionData | null;
  processing: boolean;
  error: string | null;
  onProcessingChange: (v: boolean) => void;
  onComplete: (data: { cardholderName: string; paypalOrderId: string }) => void;
  onError: (msg: string) => void;
}

const ACCEPTED_CARDS = ["Visa", "Mastercard", "American Express", "Discover"];

function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function expiryToPayPal(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 4) return value;
  return `20${digits.slice(2)}-${digits.slice(0, 2)}`;
}

function PaymentForm({
  subscriptionData,
  processing,
  error,
  onProcessingChange,
  onComplete,
  onError,
}: Props) {
  const { t, locale } = useTranslations();
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError("");

    if (!cardholderName.trim()) {
      onError(t("subscriptions.signUp.payment.errors.cardholderNameRequired"));
      return;
    }

    if (!cardNumber.trim() || cardNumber.replace(/\s/g, "").length < 12) {
      onError(t("subscriptions.signUp.payment.errors.generic"));
      return;
    }

    const expiryDigits = cardExpiry.replace(/\D/g, "");
    if (expiryDigits.length !== 4) {
      onError(t("subscriptions.signUp.payment.errors.generic"));
      return;
    }

    if (!cardCvc.trim() || cardCvc.length < 3) {
      onError(t("subscriptions.signUp.payment.errors.generic"));
      return;
    }

    onProcessingChange(true);

    try {
      const signupUserName = sessionStorage.getItem("signup_user_name") || "";
      const signupUserEmail = sessionStorage.getItem("signup_user_email") || "";
      const signupAmount = sessionStorage.getItem("signup_subscription_amount") || "0";
      const signupCurrency = sessionStorage.getItem("signup_subscription_currency") || "usd";
      const signupPlanKey = sessionStorage.getItem("signup_subscription_plan_key") || "";
      const signupBillingCycle = sessionStorage.getItem("signup_subscription_billing_cycle") || "";
      const signupUserCount = sessionStorage.getItem("signup_subscription_user_count") || "";

      const authRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!authRes.ok) {
        throw new Error("Failed to obtain auth token");
      }

      const { token: jwtToken } = await authRes.json();

      const orderRes = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          card_number: cardNumber.replace(/\s/g, ""),
          card_expiry: expiryToPayPal(cardExpiry),
          card_security_code: cardCvc,
          cardholder_name: cardholderName.trim(),
          user_name: signupUserName,
          user_email: signupUserEmail,
          plan_key: signupPlanKey,
          billing_cycle: signupBillingCycle,
          user_quantity: Number(signupUserCount),
          amount: Number(signupAmount),
          currency: signupCurrency,
        }),
      });

      const result = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok) {
        onError(result.error || "Payment processing failed");
        onProcessingChange(false);
        return;
      }

      onComplete({
        cardholderName: cardholderName.trim(),
        paypalOrderId: result.paypal_order_id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment processing failed";
      onError(message);
    }

    onProcessingChange(false);
  }

  const symbol = locale === "en" ? "$" : "R$";

  return (
    <form onSubmit={handleSubmit}>
      <S.Title>
        {t("subscriptions.signUp.payment.title")}
      </S.Title>
      <S.Subtitle>
        {t("subscriptions.signUp.payment.subtitle")}
      </S.Subtitle>

      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

      <S.SectionLabel>
        {t("subscriptions.signUp.payment.cardDetails")}
      </S.SectionLabel>

      <S.Field>
        <S.Label>
          {t("subscriptions.signUp.payment.fields.cardholderName")}
        </S.Label>
        <S.Input
          type="text"
          placeholder={t("subscriptions.signUp.payment.placeholders.cardholderName")}
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
        />
      </S.Field>

      <div style={{ marginTop: 16 }}>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.payment.fields.cardNumber")}
          </S.Label>
          <S.StripeElement>
            <S.NativeInput
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 1234 1234 1234"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </S.StripeElement>
        </S.Field>
      </div>

      <S.CardRow style={{ marginTop: 16 }}>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.payment.fields.expirationDate")}
          </S.Label>
          <S.StripeElement>
            <S.NativeInput
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
            />
          </S.StripeElement>
        </S.Field>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.payment.fields.securityCode")}
          </S.Label>
          <S.StripeElement>
            <S.NativeInput
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVC"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
            />
          </S.StripeElement>
        </S.Field>
      </S.CardRow>

      <S.AcceptedCards>
        {ACCEPTED_CARDS.map((card) => (
          <S.CardIcon key={card}>{card}</S.CardIcon>
        ))}
      </S.AcceptedCards>

      <S.SectionLabel>
        {t("subscriptions.signUp.payment.summary")}
      </S.SectionLabel>

      <S.SummaryCard>
        <S.SummaryRow>
          <S.SummaryLabel>
            {t("subscriptions.signUp.payment.selectedPlan")}
          </S.SummaryLabel>
          <S.SummaryValue>
            {subscriptionData?.planName ?? "-"}
          </S.SummaryValue>
        </S.SummaryRow>
        <S.SummaryRow>
          <S.SummaryLabel>
            {t("subscriptions.signUp.payment.billingCycle")}
          </S.SummaryLabel>
          <S.SummaryValue>
            {subscriptionData?.billingCycle === "annual"
              ? t("subscriptions.signUp.payment.annual")
              : t("subscriptions.signUp.payment.monthly")}
          </S.SummaryValue>
        </S.SummaryRow>
        <S.SummaryRow>
          <S.SummaryLabel>
            {t("subscriptions.signUp.payment.users")}
          </S.SummaryLabel>
          <S.SummaryValue>
            {subscriptionData?.userCount ?? 1}
          </S.SummaryValue>
        </S.SummaryRow>
        <S.TotalRow>
          <S.TotalLabel>
            {t("subscriptions.signUp.payment.totalAmount")}
          </S.TotalLabel>
          <S.TotalValue>
            {symbol}{subscriptionData?.amount ?? 0}
          </S.TotalValue>
        </S.TotalRow>
      </S.SummaryCard>

      <S.ButtonRow>
        <S.Button type="submit" disabled={processing} $loading={processing}>
          {processing && <S.Spinner />}
          {processing
            ? t("subscriptions.signUp.payment.processing")
            : t("subscriptions.signUp.payment.buyNow")}
        </S.Button>
      </S.ButtonRow>
    </form>
  );
}

export default function SignUpPayment(props: Props) {
  return <PaymentForm {...props} />;
}