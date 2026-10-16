"use client";

import WeAreWorking from "@/components/shared/weAreWorking/weAreWorking";
import Link from "next/link";
import * as S from "./styles";

export default function ETLSPage() {
  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.BackLink href="/dataeng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Data Engineering</span>
          </S.BackLink>
          <S.SectionTitle>ETLs Processing</S.SectionTitle>
          <S.SectionSubtitle>
            Build and monitor data transformation pipelines
          </S.SectionSubtitle>
        </S.SectionHead>

        <WeAreWorking />

        <S.SectionHead>
          <S.SectionTitle>Available Pipelines</S.SectionTitle>
          <S.SectionSubtitle>Manage your data transformation pipelines</S.SectionSubtitle>
        </S.SectionHead>
      </S.Content>
    </S.Container>
  );
}