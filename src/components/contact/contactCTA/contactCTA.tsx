"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function ContactCTA() {
  const { t } = useTranslations();

  return (
    <S.Final>
      <S.Title>
        {t("contact.cta.title")} <S.Grad>{t("contact.cta.titleHighlight")}</S.Grad>?
      </S.Title>
      <S.Desc>{t("contact.cta.description")}</S.Desc>
      <S.Row>
        <S.PrimaryButton>{t("contact.cta.startTrial")}</S.PrimaryButton>
        <S.SecondaryButton>{t("contact.cta.bookDemo")}</S.SecondaryButton>
      </S.Row>
    </S.Final>
  );
}
