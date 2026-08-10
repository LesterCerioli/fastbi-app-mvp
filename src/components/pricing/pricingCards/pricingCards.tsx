"use client";

import { useRouter } from "next/navigation";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { formatPrice } from "@/lib/i18n/currency";
import { PLANS } from "@/lib/planLimits";

interface PricingCardsProps {
  annual: boolean;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

export default function PricingCards({ annual }: PricingCardsProps) {
  const { t, locale } = useTranslations();
  const router = useRouter();

  const annualPrice = (monthly: number) =>
    Math.round(monthly * 12 * 0.8) / 12;

  const tiers = PLANS.map((plan) => ({
    key: plan.key,
    monthlyPrice: plan.monthlyPrice,
    maxUsers: plan.maxUsers,
    featured: plan.key === "professional",
    primary: plan.key === "professional",
    badge:
      plan.key === "professional"
        ? t("pricing.cards.professional.badge")
        : null,
  }));

  return (
    <S.Tiers>
      {tiers.map((tier) => {
        const name = t(`pricing.cards.${tier.key}.name`);
        const desc = t(`pricing.cards.${tier.key}.desc`);
        const features = t(`pricing.cards.${tier.key}.features`);
        const usdAmount = annual ? annualPrice(tier.monthlyPrice) : tier.monthlyPrice;
        const { symbol, value } = formatPrice(usdAmount, locale, annual);
        const userLimit =
          tier.maxUsers === null
            ? t("pricing.cards.limits.unlimited")
            : t("pricing.cards.limits.upTo", { limit: String(tier.maxUsers) });

        return (
          <S.Card key={tier.key} $featured={tier.featured}>
            {tier.badge && <S.BadgePop>{tier.badge}</S.BadgePop>}
            <S.TierName>{name}</S.TierName>
            <S.TierDesc>{desc}</S.TierDesc>
            <S.Price>
              <S.Per>{symbol}</S.Per>
              <S.Amt>{value}</S.Amt>
              <S.Per>{t("pricing.cards.perUserMo")}</S.Per>
            </S.Price>
            <S.Billed>
              {annual ? t("pricing.cards.billedAnnually") : "\u00A0"}
            </S.Billed>
            <S.UserLimit>{userLimit}</S.UserLimit>
            <S.CTAButton
              $primary={tier.primary}
              onClick={() => router.push("/signup")}
            >
              {t("header.buttons.getStarted")}
            </S.CTAButton>
            <S.FeatList>
              {Array.isArray(features)
                ? features.map((feat: string, i: number) => (
                    <S.FeatItem key={i}>
                      <S.Check><CheckIcon /></S.Check>
                      <span>{feat}</span>
                    </S.FeatItem>
                  ))
                : null}
            </S.FeatList>
          </S.Card>
        );
      })}
    </S.Tiers>
  );
}
