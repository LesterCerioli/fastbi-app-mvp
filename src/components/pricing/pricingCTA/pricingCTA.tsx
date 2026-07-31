"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function PricingCTA() {
  const { t } = useTranslations();

  return (
    <section>
      <S.Final>
        <S.Title>
          {t("pricing.cta.title")} <S.Grad>{t("pricing.cta.titleHighlight")}</S.Grad>
        </S.Title>
        <S.Desc>{t("pricing.cta.description")}</S.Desc>
        <S.Row>
          <S.PrimaryButton>{t("pricing.cta.startTrial")}</S.PrimaryButton>
          <S.SecondaryButton>{t("pricing.cta.bookDemo")}</S.SecondaryButton>
        </S.Row>
      </S.Final>
    </section>
  );
}
