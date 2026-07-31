"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function ContactHero() {
  const { t } = useTranslations();

  return (
    <S.Hero>
      <S.Eyebrow>
        <S.Dot />
        {t("contact.hero.eyebrow")}
      </S.Eyebrow>
      <S.Title>
        {t("contact.hero.title")} <S.Grad>{t("contact.hero.titleHighlight")}</S.Grad>
      </S.Title>
      <S.Lede>
        {t("contact.hero.description")}
      </S.Lede>
    </S.Hero>
  );
}
