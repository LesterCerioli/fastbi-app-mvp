"use client";

import Link from "next/link";
import * as S from "./styles";
import NavigationCard from "@/components/data_eng/navigationCard/navigationCard";

const cards = [
  {
    title: "Create New Connection",
    description: "Set up a new database connection for your organization",
    href: "/dataeng/databases/connection",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    title: "Migrations",
    description: "Manage and track database schema migrations",
    href: "/dataeng/databases/migrations",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M19 12H5" />
        <path d="M12 5a7 7 0 0 1 7 7" />
        <path d="M12 5a7 7 0 0 0-7 7" />
      </svg>
    ),
  },
  {
    title: "Health",
    description: "Monitor database connection health and performance",
    href: "/dataeng/databases/health",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function DatabasesPage() {
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
          <S.SectionTitle>Databases</S.SectionTitle>
          <S.SectionSubtitle>
            Manage your database connections, migrations, and health monitoring
          </S.SectionSubtitle>
        </S.SectionHead>

        <S.CardsGrid>
          {cards.map((card) => (
            <Link key={card.title} href={card.href}>
              <NavigationCard
                title={card.title}
                description={card.description}
                icon={card.icon}
              />
            </Link>
          ))}
        </S.CardsGrid>
      </S.Content>
    </S.Container>
  );
}