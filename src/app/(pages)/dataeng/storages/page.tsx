"use client";

import Link from "next/link";
import * as S from "./styles";
import NavigationCard from "@/components/data_eng/navigationCard/navigationCard";

const cards = [
   {
    title: "Buckets",
    description: "Build buckets to storage your files",
    href: "/dataeng/storages/buckets",
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
];
export default function SotoragesPage() {
  return (
    <S.Container>
        <S.PageBg />
        <S.Content>
            <S.SectionHead>
                <S.BackLink href="/dashboard">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="M12 19l-7-7 7-7" />  

                    </svg>
                    <span>Back to Main Dashboard</span>
                </S.BackLink>
                <S.SectionTitle>Storages</S.SectionTitle>
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