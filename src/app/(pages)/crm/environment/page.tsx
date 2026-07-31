"use client";
import { Analytics } from "@vercel/analytics/next";
// app/pages/crm/environment.page.tsx

import { useState, useEffect, Suspense, lazy } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { RefreshCw } from "lucide-react";

// Lazy load the dashboard component for better performance
const Dashboard = lazy(() => import("@/components/dashboards/dynamicDashboard/dynamicDashboard"));

interface DashboardStats {
  totalRevenue: string;
  activeUsers: number;
  growthRate: number;
  satisfactionScore: number;
}

export default function EnvironmentPage() {
  const { t } = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: "U$ 0",
    activeUsers: 0,
    growthRate: 0,
    satisfactionScore: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = async () => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats({
        totalRevenue: "U$ 2.4M",
        activeUsers: 2847,
        growthRate: 15.8,
        satisfactionScore: 94,
      });
    } catch (err) {
      setError(t("crm.errors.stats"));
      console.error(err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchStats();
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        setError(t("crm.errors.dashboard"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <S.PageContainer>
      <S.HeroSection>
        <S.HeroTitle>{t("crm.title")}</S.HeroTitle>
        <S.HeroSubtitle>
          {t("crm.subtitle")}
        </S.HeroSubtitle>
      </S.HeroSection>

      <S.ContentWrapper>
        
        <S.StatsBar>
          <S.StatItem>
            <S.StatValue>{stats.totalRevenue}</S.StatValue>
            <S.StatLabel>{t("crm.stats.totalRevenue")}</S.StatLabel>
          </S.StatItem>
          <S.StatItem>
            <S.StatValue>{stats.activeUsers.toLocaleString()}</S.StatValue>
            <S.StatLabel>{t("crm.stats.activeUsers")}</S.StatLabel>
          </S.StatItem>
          <S.StatItem>
            <S.StatValue>{stats.growthRate}%</S.StatValue>
            <S.StatLabel>{t("crm.stats.growthRate")}</S.StatLabel>
          </S.StatItem>
          <S.StatItem>
            <S.StatValue>{stats.satisfactionScore}%</S.StatValue>
            <S.StatLabel>{t("crm.stats.satisfaction")}</S.StatLabel>
          </S.StatItem>
        </S.StatsBar>

        
        <S.DashboardWrapper>
          {error ? (
            <S.ErrorMessage>
              {error}
              <S.RefreshButton onClick={handleRefresh} style={{ marginLeft: "12px" }}>
                <RefreshCw size={14} style={{ display: "inline", marginRight: "6px" }} />
                {t("crm.retry")}
              </S.RefreshButton>
            </S.ErrorMessage>
          ) : (
            <Suspense
              fallback={
                <S.LoadingOverlay>
                  <S.LoadingSpinner />
                </S.LoadingOverlay>
              }
            >
              <Dashboard key={refreshKey} />
            </Suspense>
          )}
        </S.DashboardWrapper>

        
      </S.ContentWrapper>

      
      <S.FloatingCard>
        <S.FloatingButton onClick={handleRefresh} title={t("crm.refreshTitle")}>
          <RefreshCw size={24} />
        </S.FloatingButton>
      </S.FloatingCard>
    </S.PageContainer>
  );
}