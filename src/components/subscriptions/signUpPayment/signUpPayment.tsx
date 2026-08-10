"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { SubscriptionData } from "@/components/subscriptions/signUp/signUp";
import { getStripe } from "@/lib/stripe";

interface Props {
  subscriptionData: SubscriptionData | null;
  processing: boolean;
  error: string | null;
  onProcessingChange: (v: boolean) => void;
  onComplete: (data: { cardholderName: string; stripeToken: string }) => void;
  onError: (msg: string) => void;
}

const ACCEPTED_CARDS = ["Visa", "Mastercard", "American Express", "Discover"];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      color: "#f1f5f9",
      fontFamily: '"Inter", system-ui, sans-serif',
      "::placeholder": {
        color: "#475569",
      },
    },
    invalid: {
      color: "#fca5a5",
    },
  },
};

function PaymentForm({
  subscriptionData,
  processing,
  error,
  onProcessingChange,
  onComplete,
  onError,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { t, locale } = useTranslations();
  const [cardholderName, setCardholderName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError("");

    if (!cardholderName.trim()) {
      onError(t("subscriptions.signUp.payment.errors.cardholderNameRequired"));
      return;
    }

    if (!stripe || !elements) {
      onError("Payment system not ready. Please try again.");
      return;
    }

    onProcessingChange(true);

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      onError("Card element not found.");
      onProcessingChange(false);
      return;
    }

    const { token, error: stripeError } = await stripe.createToken(
      cardNumberElement,
      { name: cardholderName.trim() }
    );

    if (stripeError) {
      onError(stripeError.message ?? "Payment error");
      onProcessingChange(false);
      return;
    }

    try {
      const authRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!authRes.ok) {
        throw new Error("Failed to obtain auth token");
      }

      const { token: jwtToken } = await authRes.json();

      const saveRes = await fetch("/api/stripe/payment-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ stripe_token_id: token.id }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save payment token");
      }

      const signupUserName = sessionStorage.getItem("signup_user_name") || "";
      const signupUserEmail = sessionStorage.getItem("signup_user_email") || "";
      const signupAmount = sessionStorage.getItem("signup_subscription_amount") || "0";
      const signupCurrency = sessionStorage.getItem("signup_subscription_currency") || "usd";
      const signupPlanKey = sessionStorage.getItem("signup_subscription_plan_key") || "";
      const signupBillingCycle = sessionStorage.getItem("signup_subscription_billing_cycle") || "";
      const signupUserCount = sessionStorage.getItem("signup_subscription_user_count") || "";

      await fetch("/api/stripe/process-pending-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          stripe_token_id: token.id,
          user_name: signupUserName,
          user_email: signupUserEmail,
          plan_key: signupPlanKey,
          billing_cycle: signupBillingCycle,
          user_quantity: Number(signupUserCount),
          amount: Number(signupAmount),
          currency: signupCurrency,
        }),
      });

      onComplete({
        cardholderName: cardholderName.trim(),
        stripeToken: token.id,
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
            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
          </S.StripeElement>
        </S.Field>
      </div>

      <S.CardRow style={{ marginTop: 16 }}>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.payment.fields.expirationDate")}
          </S.Label>
          <S.StripeElement>
            <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
          </S.StripeElement>
        </S.Field>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.payment.fields.securityCode")}
          </S.Label>
          <S.StripeElement>
            <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
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
        <S.Button type="submit" disabled={processing || !stripe} $loading={processing}>
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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  if (!stripePromise) {
    return (
      <div>
        <S.Title>Loading payment...</S.Title>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
