"use client";
import { Analytics } from "@vercel/analytics/next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { BarChart3, CheckCircle, LayoutDashboard, Settings, Target } from "lucide-react";

import imageHome from "@/app/assets/homeimages/imageHome.jpeg";
import dashboard1 from "@/app/assets/homeimages/dashboard.jpeg";
import dashboard2 from "@/app/assets/homeimages/dashboard2.jpeg";
import dashboard3 from "@/app/assets/homeimages/dashboard3.jpg";
import dashboard4 from "@/app/assets/homeimages/dashboard4.jpg";
import reports from "@/app/assets/homeimages/reppoers.jpeg";
import industries from "@/app/assets/homeimages/industries.jpeg";
import peopledata from "@/app/assets/homeimages/peple_analysing_data.jpeg";

const dashboardImages = [dashboard1, dashboard2, dashboard3, dashboard4];

export default function HomePage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const extendedDashboards = [...dashboardImages, ...dashboardImages];

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (user) setIsLoggedIn(true);
  }, []);

  return (
    <S.Container>
      {isLoggedIn && (
        <S.DashboardBanner onClick={() => router.push("/dashboards")}>
          <LayoutDashboard size={20} />
          {t("home.hero.buttons.goToDashboard")}
        </S.DashboardBanner>
      )}
      <S.Hero>
        <Image
          src={imageHome}
          alt={t("home.hero.alt")}
          fill
          priority
          style={{ objectFit: "cover" }}
        />

        <S.Overlay />

        <S.HeroContent>
          <h1>{t("home.hero.heading")}</h1>
          <p>{t("home.hero.subtitle")}</p>

          <S.ButtonGroup>
            <S.PrimaryButton>{t("home.hero.buttons.startTrial")}</S.PrimaryButton>
            <S.SecondaryButton>{t("home.hero.buttons.viewDemo")}</S.SecondaryButton>
          </S.ButtonGroup>
        </S.HeroContent>
      </S.Hero>

      <S.Features>
        <S.Card>
          <S.IconWrapper><BarChart3 size={48} color="#3b82f6" /></S.IconWrapper>
          <h3>{t("home.features.intuitiveDashboards.title")}</h3>
          <p>{t("home.features.intuitiveDashboards.desc")}</p>
        </S.Card>

        <S.Card>
          <S.IconWrapper><Settings size={48} color="#3b82f6" /></S.IconWrapper>
          <h3>{t("home.features.reportAutomation.title")}</h3>
          <p>{t("home.features.reportAutomation.desc")}</p>
        </S.Card>

        <S.Card>
          <S.IconWrapper><Target size={48} color="#3b82f6" /></S.IconWrapper>
          <h3>{t("home.features.accurateInsights.title")}</h3>
          <p>{t("home.features.accurateInsights.desc")}</p>
        </S.Card>
      </S.Features>

      <S.CarouselSection>
        <S.CarouselTitle>{t("home.carousel.title")}</S.CarouselTitle>

        <S.CarouselContainer>
          <S.CarouselTrack>
            {extendedDashboards.map((imageSrc, index) => (
              <S.DashboardCard key={index}>
                <Image
                  src={imageSrc}
                  alt={t("home.carousel.alt", { n: String(index % 4 + 1) })}
                  width={640}
                  height={390}
                  quality={85}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "16px",
                    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.12)",
                  }}
                />
              </S.DashboardCard>
            ))}
          </S.CarouselTrack>
        </S.CarouselContainer>

        <S.CarouselNote>{t("home.carousel.note")}</S.CarouselNote>
      </S.CarouselSection>

      <S.IndustriesSection>
        <S.SectionTitle>{t("home.industries.title")}</S.SectionTitle>
        <S.SectionSubtitle>{t("home.industries.subtitle")}</S.SectionSubtitle>

        <S.ImageContainer>
          <Image
            src={industries}
            alt={t("home.industries.alt")}
            width={1200}
            height={600}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "20px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            }}
          />
        </S.ImageContainer>
      </S.IndustriesSection>

      <S.ReportsSection>
        <S.SectionTitle>{t("home.reports.title")}</S.SectionTitle>
        <S.SectionSubtitle>{t("home.reports.subtitle")}</S.SectionSubtitle>

        <S.ImageContainer>
          <Image
            src={reports}
            alt={t("home.reports.alt")}
            width={420}
            height={320}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "20px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            }}
          />
        </S.ImageContainer>
      </S.ReportsSection>

      <S.SectionCenter>
        <h2>{t("home.simplifying.title")}</h2>
        <p>{t("home.simplifying.subtitle")}</p>
      </S.SectionCenter>

      <S.Details>
        <S.IllustrationWrapper>
          <Image src={peopledata} alt={t("home.details.alt")} width={420} height={320} />
        </S.IllustrationWrapper>

        <S.BenefitsList>
          <S.BenefitCard>
            <S.BenefitIconWrapper><CheckCircle size={28} color="#ffffff" /></S.BenefitIconWrapper>
            <S.BenefitContent>
              <h3>{t("home.details.connect.title")}</h3>
              <p>{t("home.details.connect.desc")}</p>
            </S.BenefitContent>
          </S.BenefitCard>

          <S.BenefitCard>
            <S.BenefitIconWrapper><LayoutDashboard size={28} color="#ffffff" /></S.BenefitIconWrapper>
            <S.BenefitContent>
              <h3>{t("home.details.dashboards.title")}</h3>
              <p>{t("home.details.dashboards.desc")}</p>
            </S.BenefitContent>
          </S.BenefitCard>

          <S.BenefitCard>
            <S.BenefitIconWrapper><Target size={28} color="#ffffff" /></S.BenefitIconWrapper>
            <S.BenefitContent>
              <h3>{t("home.details.decisions.title")}</h3>
              <p>{t("home.details.decisions.desc")}</p>
            </S.BenefitContent>
          </S.BenefitCard>
        </S.BenefitsList>
      </S.Details>
    </S.Container>
  );
}
