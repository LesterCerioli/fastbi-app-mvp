"use client";

import { useState, useMemo } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { SubscriptionData } from "@/components/subscriptions/signUp/signUp";
import { PLANS, getPlanByKey, annualUnitAmount } from "@/lib/planLimits";

interface Props {
  onContinue: (data: SubscriptionData) => void;
}

export default function SignUpSubscription({ onContinue }: Props) {
  const { t, locale } = useTranslations();
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("professional");
  const [userCount, setUserCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = useMemo(
    () => PLANS.find((p) => p.key === selectedPlan)!,
    [selectedPlan]
  );

  const unitAmount = annual ? annualUnitAmount(plan) : plan.monthlyPrice;
  const totalAmount = unitAmount * userCount;
  const maxUsers = plan.maxUsers ?? null;

  function handleUserCountChange(value: string) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setUserCount(0);
      return;
    }
    const clamped = Math.max(0, parsed);
    if (maxUsers !== null && clamped > maxUsers) {
      setUserCount(maxUsers);
      return;
    }
    setUserCount(clamped);
  }

  function handleContinue() {
    setError("");
    setLoading(true);

    setTimeout(() => {
      const planDef = getPlanByKey(plan.key);

      if (!planDef) {
        setError(t("subscriptions.signUp.subscription.errors.generic"));
        setLoading(false);
        return;
      }

      if (!Number.isInteger(userCount) || userCount < 1) {
        setError(t("subscriptions.signUp.subscription.errors.usersRequired"));
        setLoading(false);
        return;
      }

      if (planDef.maxUsers !== null && userCount > planDef.maxUsers) {
        setError(
          t("subscriptions.signUp.subscription.errors.limitExceeded", {
            limit: String(planDef.maxUsers),
          })
        );
        setLoading(false);
        return;
      }

      onContinue({
        planKey: plan.key,
        planName: plan.name,
        billingCycle: annual ? "annual" : "monthly",
        amount: totalAmount,
        userCount,
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
          const usdAmount = annual ? annualUnitAmount(p) : p.monthlyPrice;
          const symbol = locale === "en" ? "$" : "R$";
          const limitLabel =
            p.maxUsers === null
              ? t("subscriptions.signUp.subscription.unlimitedUsers")
              : t("subscriptions.signUp.subscription.usersLimit", {
                  limit: String(p.maxUsers),
                });

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
                <S.PlanLimit>{limitLabel}</S.PlanLimit>
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
        {t("subscriptions.signUp.subscription.users")}
      </S.SectionLabel>

      <S.UserField>
        <S.Input
          $invalid={userCount < 1}
          type="number"
          min={1}
          max={maxUsers ?? undefined}
          value={userCount || ""}
          onChange={(e) => handleUserCountChange(e.target.value)}
          placeholder="1"
        />
        {maxUsers !== null ? (
          <S.UserHint>
            {t("subscriptions.signUp.subscription.usersHint", {
              limit: String(maxUsers),
            })}
          </S.UserHint>
        ) : (
          <S.UserHint>
            {t("subscriptions.signUp.subscription.unlimitedHint")}
          </S.UserHint>
        )}
      </S.UserField>

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
            {t("subscriptions.signUp.subscription.users")}
          </S.SummaryLabel>
          <S.SummaryValue>{userCount}</S.SummaryValue>
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