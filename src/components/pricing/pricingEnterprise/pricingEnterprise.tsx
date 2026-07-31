"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function PricingEnterprise() {
  const { t } = useTranslations();

  return (
    <S.Enterprise>
      <S.Info>
        <S.Title>{t("pricing.enterprise.title")}</S.Title>
        <S.Desc>{t("pricing.enterprise.desc")}</S.Desc>
      </S.Info>
      <S.Stats>
        <S.Stat>
          <S.StatNum>2.4M+</S.StatNum>
          <S.StatLabel>{t("pricing.enterprise.stats.activeUsers")}</S.StatLabel>
        </S.Stat>
        <S.Stat>
          <S.StatNum>99.9%</S.StatNum>
          <S.StatLabel>{t("pricing.enterprise.stats.uptimeSla")}</S.StatLabel>
        </S.Stat>
        <S.Stat>
          <S.StatNum>150+</S.StatNum>
          <S.StatLabel>{t("pricing.enterprise.stats.integrations")}</S.StatLabel>
        </S.Stat>
      </S.Stats>
      <S.CTAButton>{t("pricing.enterprise.button")}</S.CTAButton>
    </S.Enterprise>
  );
}
