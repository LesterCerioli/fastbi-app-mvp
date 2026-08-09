"use client";
import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import KPIsCreation from "@/components/kpis/kpisCreation/kpisCreation";
import ListKpis from "@/components/kpis/listKpis/listKpis";

export default function KPIsPage() {
  const { t } = useTranslations();
  const [refreshKey, setRefreshKey] = useState(0);

  let sessionOrganizationName = "";
  if (typeof window !== "undefined") {
    sessionOrganizationName =
      sessionStorage.getItem("organization_name") || "";
  }
  const [organizationName, setOrganizationName] = useState(
    sessionOrganizationName
  );

  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.SectionTitle>{t("kpis.page.title")}</S.SectionTitle>
          <S.SectionSubtitle>{t("kpis.page.subtitle")}</S.SectionSubtitle>
        </S.SectionHead>

        <S.CreationSection>
          <KPIsCreation
            organizationName={organizationName}
            onSuccess={(orgName) => {
              if (orgName) setOrganizationName(orgName);
              setRefreshKey((k) => k + 1);
            }}
          />
        </S.CreationSection>

        <S.ListSection>
          <ListKpis organizationName={organizationName} refreshKey={refreshKey} />
        </S.ListSection>
      </S.Content>
    </S.Container>
  );
}