"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface PricingHeroProps {
  annual: boolean;
  onToggle: (val: boolean) => void;
}

export default function PricingHero({ annual, onToggle }: PricingHeroProps) {
  const { t } = useTranslations();

  return (
    <S.Hero>
      <S.Eyebrow>
        <S.Dot />
        {t("pricing.hero.eyebrow")}
      </S.Eyebrow>
      <S.Title>
        {t("pricing.hero.title")} <br />
        <S.Grad>{t("pricing.hero.titleHighlight")}</S.Grad>
      </S.Title>
      <S.Lede>{t("pricing.hero.description")}</S.Lede>
      <S.ToggleWrap>
        <S.Toggle>
          <S.Slider $annual={annual} />
          <S.ToggleBtn $on={!annual} onClick={() => onToggle(false)}>
            {t("pricing.hero.monthly")}
          </S.ToggleBtn>
          <S.ToggleBtn $on={annual} onClick={() => onToggle(true)}>
            {t("pricing.hero.annual")}
          </S.ToggleBtn>
        </S.Toggle>
        <S.SaveTag>{t("pricing.hero.saveTag")}</S.SaveTag>
      </S.ToggleWrap>
    </S.Hero>
  );
}
