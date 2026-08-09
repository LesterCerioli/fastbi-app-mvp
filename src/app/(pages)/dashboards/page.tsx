"use client";
import { Analytics } from "@vercel/analytics/next";
import React, { useState, useEffect, useCallback } from 'react';
import * as S from './styles';
import { useTranslations } from "@/lib/i18n/useTranslations";

import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  LayoutDashboard,
  PieChart,
  LineChart as LineChartIcon,
  RefreshCw,
  Calendar,
  Download
} from 'lucide-react';
import MainPredictiveDashboard from '@/components/dashboards/dashboardPreditivoPrincipal/dashboardPreditivoPrincipal';
import DashboardPie from '@/components/dashboards/dashboardPie/dashboardPie';
import AnimatedDashboard from '@/components/dashboards/animatedDashboard/animatedDashboard';

type DashboardView = 'sales' | 'composition';

function fmtCurrency(value: number): string {
  if (value >= 1000000) return "$" + (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return "$" + (value / 1000).toFixed(0) + "K";
  return "$" + value.toFixed(0);
}

function fmtPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(0) + "%";
}

function fmtNumber(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toFixed(0);
}

interface DashboardOverview {
  organization_name: string;
  revenue: number | null;
  total_transactions: number | null;
  growth: number | null;
  customers: number | null;
  details: {
    revenue: Record<string, unknown> | null;
    executive_summary: Record<string, unknown> | null;
    kpi_revenue: Record<string, unknown> | null;
    forecast: Record<string, unknown> | null;
    product_mix: Record<string, unknown> | null;
  };
}

async function getFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch { return null; }
}

const DashboardsPage: React.FC = () => {
  const { t } = useTranslations();
  const [activeView, setActiveView] = useState<DashboardView>('sales');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const token = await getFreshToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/dashboard/overview", { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // keep null
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    const id = setTimeout(() => setLastUpdated(new Date()), 0);
    return () => clearTimeout(id);
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    window.dispatchEvent(new Event('refreshDashboard'));
    fetchOverview();
  };

  const handleExport = () => {
    console.log('Exporting dashboard data...');
  };

  return (
    <S.Container>
      <S.DashboardWrapper>
        <S.BackgroundGradient />
        
        <S.ContentContainer>
          <S.HeroSection>
            <S.HeroContent>
              <S.HeroBadge>
                <Activity size={16} />
                {t("dashboards.badge")}
              </S.HeroBadge>
              <S.HeroTitle>
                {t("dashboards.title")}
                <S.HeroHighlight>{t("dashboards.titleHighlight")}</S.HeroHighlight>
              </S.HeroTitle>
              <S.HeroDescription>
                {t("dashboards.description")}
              </S.HeroDescription>
            </S.HeroContent>
            
            <S.HeroStats>
              <S.StatCard>
                <S.StatIcon>
                  <TrendingUp size={20} />
                </S.StatIcon>
                <S.StatInfo>
                  <S.StatValue>{overview?.growth != null ? fmtPercent(overview.growth) : "—"}</S.StatValue>
                  <S.StatLabel>{t("dashboards.stats.revenueGrowth")}</S.StatLabel>
                </S.StatInfo>
              </S.StatCard>
              
              <S.StatCard>
                <S.StatIcon>
                  <DollarSign size={20} />
                </S.StatIcon>
                <S.StatInfo>
                  <S.StatValue>{overview?.revenue != null ? fmtCurrency(overview.revenue) : "—"}</S.StatValue>
                  <S.StatLabel>Total Revenue</S.StatLabel>
                </S.StatInfo>
              </S.StatCard>
              
              <S.StatCard>
                <S.StatIcon>
                  <Users size={20} />
                </S.StatIcon>
                <S.StatInfo>
                  <S.StatValue>{overview?.customers != null ? fmtNumber(overview.customers) : "—"}</S.StatValue>
                  <S.StatLabel>{t("dashboards.stats.activeUsers")}</S.StatLabel>
                </S.StatInfo>
              </S.StatCard>
            </S.HeroStats>
          </S.HeroSection>

          <S.ControlsBar>
            <S.ViewToggle>
              <S.ToggleButton 
                active={activeView === 'sales'}
                onClick={() => setActiveView('sales')}
              >
                <LineChartIcon size={18} />
                {t("dashboards.controls.salesForecast")}
              </S.ToggleButton>
              <S.ToggleButton 
                active={activeView === 'composition'}
                onClick={() => setActiveView('composition')}
              >
                <PieChart size={18} />
                {t("dashboards.controls.compositionAnalysis")}
              </S.ToggleButton>
            </S.ViewToggle>
            
            <S.ActionsGroup>
              <S.DateDisplay>
                <Calendar size={16} />
                {t("dashboards.controls.lastUpdated", { time: lastUpdated ? lastUpdated.toLocaleTimeString() : "" })}
              </S.DateDisplay>
              <S.ActionButton onClick={handleRefresh}>
                <RefreshCw size={16} />
                {t("dashboards.controls.refresh")}
              </S.ActionButton>
              <S.ActionButton variant="primary" onClick={handleExport}>
                <Download size={16} />
                {t("dashboards.controls.exportReport")}
              </S.ActionButton>
            </S.ActionsGroup>
          </S.ControlsBar>

          <S.DashboardContainer>
            <S.DashboardCard animate>
              {activeView === 'sales' ? (
                <MainPredictiveDashboard
                  organizationName={overview?.organization_name ?? null}
                  forecastData={overview?.details?.forecast ?? null}
                  executiveSummary={overview?.details?.executive_summary ?? null}
                />
              ) : (
                <DashboardPie
                  organizationName={overview?.organization_name ?? null}
                  productMix={overview?.details?.product_mix ?? null}
                />
              )}
            </S.DashboardCard>
          </S.DashboardContainer>

          <S.InsightsSection>
            <S.InsightsHeader>
              <S.InsightsTitle>
                <LayoutDashboard size={24} />
                {t("dashboards.insights.title")}
              </S.InsightsTitle>
              <S.InsightsSubtitle>
                {t("dashboards.insights.subtitle")}
              </S.InsightsSubtitle>
            </S.InsightsHeader>
            
            <S.InsightsGrid>
              <S.InsightCard>
                <S.InsightIcon>📈</S.InsightIcon>
                <S.InsightContent>
                  <S.InsightCardTitle>{t("dashboards.insights.revenueGrowth.title")}</S.InsightCardTitle>
                  <S.InsightText>
                    {t("dashboards.insights.revenueGrowth.text")}
                  </S.InsightText>
                  <S.InsightConfidence confidence={92}>
                    {t("dashboards.insights.revenueGrowth.confidence", { pct: "92" })}
                  </S.InsightConfidence>
                </S.InsightContent>
              </S.InsightCard>
              
              <S.InsightCard>
                <S.InsightIcon>⚠️</S.InsightIcon>
                <S.InsightContent>
                  <S.InsightCardTitle>{t("dashboards.insights.riskAlert.title")}</S.InsightCardTitle>
                  <S.InsightText>
                    {t("dashboards.insights.riskAlert.text")}
                  </S.InsightText>
                  <S.InsightConfidence confidence={88}>
                    {t("dashboards.insights.riskAlert.confidence", { pct: "88" })}
                  </S.InsightConfidence>
                </S.InsightContent>
              </S.InsightCard>
              
              <S.InsightCard>
                <S.InsightIcon>🎯</S.InsightIcon>
                <S.InsightContent>
                  <S.InsightCardTitle>{t("dashboards.insights.optimization.title")}</S.InsightCardTitle>
                  <S.InsightText>
                    {t("dashboards.insights.optimization.text")}
                  </S.InsightText>
                  <S.InsightConfidence confidence={96}>
                    {t("dashboards.insights.optimization.confidence", { pct: "96" })}
                  </S.InsightConfidence>
                </S.InsightContent>
              </S.InsightCard>
            </S.InsightsGrid>
          </S.InsightsSection>

          <AnimatedDashboard />
        </S.ContentContainer>
      </S.DashboardWrapper>
    </S.Container>
  );
};

export default DashboardsPage;
