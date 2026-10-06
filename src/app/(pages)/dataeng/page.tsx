"use client";

import Link from "next/link";
import * as S from "./styles";
import NavigationCard from "@/components/data_eng/navigationCard/navigationCard";

const cards = [
  {
    title: "Databases",
    description: "Manage database connections, migrations, and health",
    href: "/dataeng/databases",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v16" />
        <path d="M20 4v16" />
        <path d="M4 12h16" />
        <path d="M4 8h16" />
        <path d="M4 16h16" />
      </svg>
    ),
  },
  {
    title: "Storages",
    description: "Configure object storage and file systems",
    href: "/dataeng/storages",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
        <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8" />
        <path d="M3 16h18" />
        <path d="M3 8h18" />
      </svg>
    ),
  },
  {
    title: "ETLs Processing",
    description: "Build and monitor data transformation pipelines",
    href: "/dataeng/etls",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4" />
        <path d="M17 16V4" />
        <path d="M5 16h14" />
        <path d="M5 20h14" />
        <path d="M12 4v12" />
      </svg>
    ),
  },
  {
    title: "Data Analysis",
    description: "Explore, query, and visualize your data",
    href: "/dataeng/analysis",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
        <path d="M2 16h20" />
      </svg>
    ),
  },
];

export default function DataEngPage() {
  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.SectionTitle>Data Engineering</S.SectionTitle>
          <S.SectionSubtitle>
            Choose a domain to configure and manage your data infrastructure
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