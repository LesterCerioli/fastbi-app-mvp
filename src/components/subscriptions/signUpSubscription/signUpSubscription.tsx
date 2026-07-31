"use client";

import { useState, useMemo } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { SubscriptionData } from "@/components/subscriptions/signUp/signUp";

interface Props {
  onContinue: (data: SubscriptionData) => void;
}

interface Plan {
  key: string;
  name: string;
  desc: string;
  monthlyPrice: number;
}

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    desc: "Perfect for small teams getting started",
    monthlyPrice: 39,
  },
  {
    key: "professional",
    name: "Professional",
    desc: "Best for growing businesses",
    monthlyPrice: 89,
  },
  {
    key: "business",
    name: "Business",
    desc: "Advanced features for large organizations",
    monthlyPrice: 149,
  },
];

const annualPrice = (monthly: number) => Math.round(monthly * 12 * 0.8);

export default function SignUpSubscription({ onContinue }: Props) {
  const { t, locale } = useTranslations();
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = useMemo(
    () => PLANS.find((p) => p.key === selectedPlan)!,
    [selectedPlan]
  );

  const unitAmount = annual ? annualPrice(plan.monthlyPrice) : plan.monthlyPrice;
  const totalAmount = unitAmount;

  function handleContinue() {
    setError("");
    setLoading(true);

    setTimeout(() => {
      onContinue({
        planKey: plan.key,
        planName: plan.name,
        billingCycle: annual ? "annual" : "monthly",
        amount: totalAmount,
      });
      setLoading(false);
    }, 300);
  }

  return (
    <div>
      <S.Title>
        {t("subscriptions.signUp.subscription.title")}
      </S.Title>
      <S.Subtitle>
        {t("subscriptions.signUp.subscription.subtitle")}
      </S.Subtitle>

      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

      <S.SectionLabel>
        {t("subscriptions.signUp.subscription.billingCycle")}
      </S.SectionLabel>

      <S.ToggleRow>
        <S.ToggleOption
          type="button"
          $active={!annual}
          onClick={() => setAnnual(false)}
        >
          {t("subscriptions.signUp.subscription.monthly")}
        </S.ToggleOption>
        <S.ToggleOption
          type="button"
          $active={annual}
          onClick={() => setAnnual(true)}
        >
          {t("subscriptions.signUp.subscription.annual")}
        </S.ToggleOption>
      </S.ToggleRow>

      <S.PlanGrid>
        {PLANS.map((p) => {
          const isSelected = selectedPlan === p.key;
          const usdAmount = annual ? annualPrice(p.monthlyPrice) : p.monthlyPrice;
          const symbol = locale === "en" ? "$" : "R$";

          return (
            <S.PlanCard
              key={p.key}
              type="button"
              $selected={isSelected}
              onClick={() => setSelectedPlan(p.key)}
            >
              <S.PlanRadio $selected={isSelected} />
              <S.PlanInfo>
                <S.PlanName>{p.name}</S.PlanName>
                <S.PlanDesc>{p.desc}</S.PlanDesc>
              </S.PlanInfo>
              <div>
                <S.PlanPrice>
                  {symbol}{usdAmount}
                </S.PlanPrice>
                <S.PlanPricePeriod>
                  /{annual ? "yr" : "mo"}
                </S.PlanPricePeriod>
              </div>
            </S.PlanCard>
          );
        })}
      </S.PlanGrid>

      <S.SectionLabel>
        {t("subscriptions.signUp.subscription.planSummary")}
      </S.SectionLabel>

      <S.SummaryCard>
        <S.SummaryRow>
          <S.SummaryLabel>
            {t("subscriptions.signUp.subscription.selectedPlan")}
          </S.SummaryLabel>
          <S.SummaryValue>{plan.name}</S.SummaryValue>
        </S.SummaryRow>
        <S.SummaryRow>
          <S.SummaryLabel>
            {t("subscriptions.signUp.subscription.billingCycle")}
          </S.SummaryLabel>
          <S.SummaryValue>
            {annual
              ? t("subscriptions.signUp.subscription.annual")
              : t("subscriptions.signUp.subscription.monthly")}
          </S.SummaryValue>
        </S.SummaryRow>
        <S.TotalRow>
          <S.TotalLabel>
            {t("subscriptions.signUp.subscription.totalAmount")}
          </S.TotalLabel>
          <S.TotalValue>
            {locale === "en" ? "$" : "R$"}{totalAmount}
          </S.TotalValue>
        </S.TotalRow>
      </S.SummaryCard>

      <S.ButtonRow>
        <S.Button type="button" onClick={handleContinue} disabled={loading}>
          {loading
            ? t("subscriptions.signUp.subscription.processing")
            : t("subscriptions.signUp.subscription.continue")}
        </S.Button>
      </S.ButtonRow>
    </div>
  );
}
