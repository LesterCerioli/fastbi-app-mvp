"use client";
import { Analytics } from "@vercel/analytics/next";

import * as S from "./styles";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/useTranslations";

import dashboardImg from "@/app/assets/features11.jpeg";

export default function FeaturesPage() {
  const { t } = useTranslations();
  const router = useRouter();

  return (
    <S.Container>
      <S.HeroSection>
        <S.Left>
          <S.Badge>{t("features.badge")}</S.Badge>

          <S.Title>
            {t("features.title")} <br />
            <span>{t("features.titleHighlight")}</span>
          </S.Title>

          <S.Description>{t("features.description")}</S.Description>

          <S.Actions>
            <S.PrimaryButton>{t("features.buttons.startTrial")}</S.PrimaryButton>
            <S.SecondaryButton>{t("features.buttons.bookDemo")}</S.SecondaryButton>
          </S.Actions>

          <S.Stats>
            <div>
              <strong>2.4M+</strong>
              <span>{t("features.stats.activeUsers")}</span>
            </div>
            <div>
              <strong>99.9%</strong>
              <span>{t("features.stats.uptimeSla")}</span>
            </div>
            <div>
              <strong>150+</strong>
              <span>{t("features.stats.integrations")}</span>
            </div>
          </S.Stats>
        </S.Left>

        <S.Right>
          <S.ImageWrapper>
            <Image
              src={dashboardImg}
              alt={t("features.imageAlt")}
              fill
              priority
            />
          </S.ImageWrapper>
        </S.Right>
      </S.HeroSection>

      <S.DashboardSection>
          <S.DashboardCard onClick={() => router.push("/dashboards")}>
          <S.DashboardCardText>
            <h2>{t("features.exploreDashboards.title")}</h2>
            <p>{t("features.exploreDashboards.desc")}</p>
          </S.DashboardCardText>
          <S.DashboardCardArrow>→</S.DashboardCardArrow>
        </S.DashboardCard>
      </S.DashboardSection>
    </S.Container>
  );
}

