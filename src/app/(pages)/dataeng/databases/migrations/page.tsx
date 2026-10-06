"use client";

import * as S from "./styles";

export default function MigrationsPage() {
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
          <S.SectionTitle>Migrations</S.SectionTitle>
          <S.SectionSubtitle>
            Manage and track database schema migrations
          </S.SectionSubtitle>
        </S.SectionHead>

        <S.ComingSoon>
          <S.Icon>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12H5" />
              <path d="M12 5a7 7 0 0 1 7 7" />
              <path d="M12 5a7 7 0 0 0-7 7" />
            </svg>
          </S.Icon>
          <S.Title>Coming Soon</S.Title>
          <S.Description>
            Database migrations management will be available here.
            Track schema changes, version history, and deployment status.
          </S.Description>
        </S.ComingSoon>
      </S.Content>
    </S.Container>
  );
}