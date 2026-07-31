"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function Footer() {
  const { t } = useTranslations();

  return (
    <S.Container>
      <S.Content>
        <S.Logo>{t("footer.logoText")}</S.Logo>

        <S.Nav>
          <a>{t("footer.nav.home")}</a>
          <a>{t("footer.nav.features")}</a>
          <a>{t("footer.nav.pricing")}</a>
          <a>{t("footer.nav.contact")}</a>
        </S.Nav>

        <S.Copy>
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </S.Copy>
      </S.Content>
    </S.Container>
  );
}