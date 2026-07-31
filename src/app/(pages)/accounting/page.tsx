"use client";
import { useState } from "react";
import * as S from "./styles";
import Header from "@/components/shared/header/header";
import CreateAccountingTemplate from "@/components/accounting/createAccountingTemplate/createAccountingTemplate";
import { useTranslations } from "@/lib/i18n/useTranslations";

type View = "menu" | "template" | "workflows" | "operations";

export default function AccountingPage() {
  const { t } = useTranslations();
  const [view, setView] = useState<View>("menu");

  return (
    <S.PageWrapper>
      <Header />
      <S.Container>
        {view === "menu" && (
          <S.CardsGrid>
            <S.Card onClick={() => setView("template")}>
              {t("accounting.menu.templates")}
            </S.Card>
            <S.Card onClick={() => setView("workflows")}>
              {t("accounting.menu.workflows")}
            </S.Card>
            <S.Card onClick={() => setView("operations")}>
              {t("accounting.menu.operations")}
            </S.Card>
          </S.CardsGrid>
        )}

        {view === "template" && (
          <>
            <S.BackButton onClick={() => setView("menu")}>{t("accounting.menu.back")}</S.BackButton>
            <CreateAccountingTemplate />
          </>
        )}

        {view === "workflows" && (
          <>
            <S.BackButton onClick={() => setView("menu")}>{t("accounting.menu.back")}</S.BackButton>
            <S.Placeholder>{t("accounting.menu.comingSoon", { name: t("accounting.menu.workflows") })}</S.Placeholder>
          </>
        )}

        {view === "operations" && (
          <>
            <S.BackButton onClick={() => setView("menu")}>{t("accounting.menu.back")}</S.BackButton>
            <S.Placeholder>{t("accounting.menu.comingSoon", { name: t("accounting.menu.operations") })}</S.Placeholder>
          </>
        )}
      </S.Container>
    </S.PageWrapper>
  );
}
