"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function BackToDashboards() {
  const { t } = useTranslations();

  return (
    <S.BackButton href="/dashboard" aria-label={t("backToDashboards.label")}>
      <S.ArrowIcon aria-hidden="true">&larr;</S.ArrowIcon>
      <S.Label>{t("backToDashboards.label")}</S.Label>
    </S.BackButton>
  );
}