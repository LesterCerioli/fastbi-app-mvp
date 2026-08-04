"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { TrendingUp, Users, DollarSign, ShoppingCart, ArrowRight, Workflow } from "lucide-react";

interface DashboardOverview {
  revenue: number | null;
  total_transactions: number | null;
  growth: number | null;
  customers: number | null;
}

function fmtCurrency(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(1) + "%";
}

function fmtNumber(value: number): string {
  return value.toLocaleString("en-US");
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

export default function DashboardPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/dashboard/overview", { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // silently fail — keep null
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <S.Container>
      <S.Content>
        <S.TopBar>
          <S.Greeting>
            <h1>{t("businessDashboards.subtitle")}</h1>
            {user?.name && <S.UserWelcome>Welcome, {user.name}</S.UserWelcome>}
          </S.Greeting>
        </S.TopBar>

        <S.StatsGrid>
          <S.StatCard>
            <S.StatIcon><DollarSign size={24} /></S.StatIcon>
            <S.StatInfo>
              <S.StatValue>{overview?.revenue != null ? fmtCurrency(overview.revenue) : "—"}</S.StatValue>
              <S.StatLabel>{t("businessDashboards.revenue")}</S.StatLabel>
            </S.StatInfo>
          </S.StatCard>

          <S.StatCard>
            <S.StatIcon><Users size={24} /></S.StatIcon>
            <S.StatInfo>
              <S.StatValue>{overview?.customers != null ? fmtNumber(overview.customers) : "—"}</S.StatValue>
              <S.StatLabel>{t("businessDashboards.customers")}</S.StatLabel>
            </S.StatInfo>
          </S.StatCard>

          <S.StatCard>
            <S.StatIcon><ShoppingCart size={24} /></S.StatIcon>
            <S.StatInfo>
              <S.StatValue>{overview?.total_transactions != null ? fmtNumber(overview.total_transactions) : "—"}</S.StatValue>
              <S.StatLabel>{t("businessDashboards.orders")}</S.StatLabel>
            </S.StatInfo>
          </S.StatCard>

          <S.StatCard>
            <S.StatIcon><TrendingUp size={24} /></S.StatIcon>
            <S.StatInfo>
              <S.StatValue>{overview?.growth != null ? fmtPercent(overview.growth) : "—"}</S.StatValue>
              <S.StatLabel>{t("businessDashboards.growth")}</S.StatLabel>
            </S.StatInfo>
          </S.StatCard>
        </S.StatsGrid>

        <S.NavGrid>
          <S.NavCard onClick={() => router.push("/dashboards")}>
            <S.NavCardContent>
              <S.NavCardTitle>{t("dashboards.title")}</S.NavCardTitle>
              <S.NavCardDesc>{t("dashboards.description")}</S.NavCardDesc>
            </S.NavCardContent>
            <ArrowRight size={20} />
          </S.NavCard>

          <S.NavCard onClick={() => router.push("/dataeng")}>
            <S.NavCardContent>
              <S.NavCardTitle>{t("dataeng.title")}</S.NavCardTitle>
              <S.NavCardDesc>{t("dataeng.subtitle")}</S.NavCardDesc>
            </S.NavCardContent>
            <ArrowRight size={20} />
          </S.NavCard>

          <S.NavCard onClick={() => router.push("/workflows")}>
            <S.NavCardContent>
              <S.NavCardTitle>Workflows</S.NavCardTitle>
              <S.NavCardDesc>Build and manage custom business workflows</S.NavCardDesc>
            </S.NavCardContent>
            <Workflow size={20} />
          </S.NavCard>
        </S.NavGrid>
      </S.Content>
    </S.Container>
  );
}
