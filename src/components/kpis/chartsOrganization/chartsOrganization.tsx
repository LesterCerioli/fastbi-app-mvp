"use client";

import { useState, useEffect, useCallback } from "react";
import * as S from "./styles";
import KpiChart from "@/components/kpis/kpiChart/kpiChart";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface ChartsOrganizationKpisProps {
  organizationName: string | null;
}

export default function ChartsOrganizationKpis({
  organizationName,
}: ChartsOrganizationKpisProps) {
  const { t } = useTranslations();
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    if (!organizationName) return;
    setIsLoading(true);
    setError(null);

    try {
      const tokenRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!tokenRes.ok) throw new Error("token");
      const tokenData = await tokenRes.json();

      const params = new URLSearchParams({
        organization_name: organizationName,
        order_by: "created_at",
        order_dir: "DESC",
        limit: "100",
      });

      const res = await fetch(`/api/kpis?${params}`, {
        headers: { Authorization: `Bearer ${tokenData.token}` },
      });
      if (!res.ok) throw new Error("fetch");
      const data = await res.json();

      setCodes(
        Array.isArray(data.data)
          ? data.data.map((kpi: { code: string }) => kpi.code)
          : []
      );
    } catch {
      setError(t("kpis.list.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [organizationName, t]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  if (!organizationName || isLoading) {
    return (
      <S.Block>
        <S.Header>{t("kpis.chart.title")}</S.Header>
        <S.LoadingRow>
          <S.Spinner />
          <S.LoadingText>{t("kpis.list.loading")}</S.LoadingText>
        </S.LoadingRow>
      </S.Block>
    );
  }

  if (error) {
    return (
      <S.Block>
        <S.Header>{t("kpis.chart.title")}</S.Header>
        <S.Text>{error}</S.Text>
      </S.Block>
    );
  }

  if (codes.length === 0) {
    return (
      <S.Block>
        <S.Header>{t("kpis.chart.title")}</S.Header>
        <S.Text>{t("kpis.chart.empty")}</S.Text>
      </S.Block>
    );
  }

  return (
    <S.Block>
      <S.Header>{t("kpis.chart.title")}</S.Header>
      <S.Grid>
        {codes.map((code) => (
          <S.ChartItem key={code}>
            <S.ChartLabel>{code}</S.ChartLabel>
            <KpiChart
              code={code}
              organizationName={organizationName}
            />
          </S.ChartItem>
        ))}
      </S.Grid>
    </S.Block>
  );
}