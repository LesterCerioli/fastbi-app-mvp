"use client";
import { Analytics } from "@vercel/analytics/next";

import * as S from "./styles";
import CreateClientConnection from "@/components/data_eng/clientconnection/createClientConnection/createClientConnection";
import ListClientConnection from "@/components/data_eng/clientconnection/listClientConnection/listClientConnection";

export default function DataEngPage() {
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
        <CreateClientConnection />
        <S.ListSection>
          <ListClientConnection />
        </S.ListSection>
      </S.Content>
    </S.Container>
  );
}
