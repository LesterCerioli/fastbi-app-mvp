"use client";
import { useState } from "react";
import { Analytics } from "@vercel/analytics/next";

import * as S from "./styles";
import CreateClientConnection from "@/components/data_eng/clientconnection/createClientConnection/createClientConnection";
import ListClientConnection from "@/components/data_eng/clientconnection/listClientConnection/listClientConnection";
import DataImporting from "@/components/data_eng/dataImporting/dataImporting";
import GeneralFilesList from "@/components/data_eng/generalFiles/generalFiles";
import SqlEditor from "@/components/data_eng/sqlEditor/sqlEditor";

export default function DataEngPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedConnection, setSelectedConnection] = useState<{
    id: string;
    name: string;
  } | null>(null);

  let organizationName = "";
  if (typeof window !== "undefined") {
    organizationName = sessionStorage.getItem("organization_name") || "";
  }

  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.SectionTitle>Data Engineering</S.SectionTitle>
          <S.SectionSubtitle>
            Configure and manage your database connections
          </S.SectionSubtitle>
        </S.SectionHead>

        {selectedConnection ? (
          <SqlEditor
            connectionId={selectedConnection.id}
            connectionName={selectedConnection.name}
            organizationName={organizationName}
            onBack={() => setSelectedConnection(null)}
          />
        ) : (
          <>
            <CreateClientConnection
              organizationName={organizationName}
              onSuccess={() => setRefreshKey((k) => k + 1)}
            />
            <S.ListSection>
              <ListClientConnection
                organizationName={organizationName}
                refreshKey={refreshKey}
                onSelect={(id, name) =>
                  setSelectedConnection({ id, name })
                }
              />
            </S.ListSection>
            <DataImporting />
            <S.ListSection>
              <GeneralFilesList organizationName={organizationName} />
            </S.ListSection>
          </>
        )}
      </S.Content>
    </S.Container>
  );
}
