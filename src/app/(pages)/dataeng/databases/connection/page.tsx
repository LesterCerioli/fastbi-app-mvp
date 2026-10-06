"use client";

import { useState } from "react";
import * as S from "./styles";
import CreateClientConnection from "@/components/data_eng/clientconnection/createClientConnection/createClientConnection";

export default function ConnectionPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  let organizationName = "";
  if (typeof window !== "undefined") {
    organizationName = sessionStorage.getItem("organization_name") || "";
  }

  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.BackLink href="/dataeng/databases">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Databases</span>
          </S.BackLink>
          <S.SectionTitle>Create New Connection</S.SectionTitle>
          <S.SectionSubtitle>
            Configure a new database connection for your organization
          </S.SectionSubtitle>
        </S.SectionHead>

        <CreateClientConnection
          organizationName={organizationName}
          refreshKey={refreshKey}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      </S.Content>
    </S.Container>
  );
}