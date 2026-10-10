"use client";

import * as S from "./styles";

export default function HealthPage() {
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
          <S.SectionTitle>Health</S.SectionTitle>
          <S.SectionSubtitle>
            Monitor database connection health and performance
          </S.SectionSubtitle>
        </S.SectionHead>

        <S.ComingSoon>
          <S.Icon>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </S.Icon>
          <S.Title>Coming Soon</S.Title>
          <S.Description>
            Database health monitoring will be available here.
            View connection status, latency metrics, and performance indicators.
          </S.Description>
        </S.ComingSoon>
      </S.Content>
    </S.Container>
  );
}