"use client";

import { useRouter } from "next/navigation";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { formatPrice } from "@/lib/i18n/currency";

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

  const tiers = [
    {
      key: "starter",
      monthlyPrice: 39,
      featured: false,
      primary: false,
    },
    {
      key: "professional",
      monthlyPrice: 89,
      featured: true,
      primary: true,
      badge: t("pricing.cards.professional.badge"),
    },
    {
      key: "business",
      monthlyPrice: 149,
      featured: false,
      primary: false,
    },
  ];

  return (
    <S.Tiers>
      {tiers.map((tier) => {
        const name = t(`pricing.cards.${tier.key}.name`);
        const desc = t(`pricing.cards.${tier.key}.desc`);
        const features = t(`pricing.cards.${tier.key}.features`);
        const usdAmount = annual ? annualPrice(tier.monthlyPrice) : tier.monthlyPrice;
        const { symbol, value } = formatPrice(usdAmount, locale, annual);

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
