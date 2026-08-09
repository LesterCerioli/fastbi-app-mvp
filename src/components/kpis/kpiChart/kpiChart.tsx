"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

const PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#60a5fa",
  "#4ade80",
  "#fb923c",
  "#e879f9",
  "#2dd4bf",
  "#facc15",
];

interface SeriesPoint {
  calculated_at: string;
  value: number;
  variance: number | null;
  target_status: string;
}

interface BreakdownSlice {
  label: string;
  value: number;
}

interface KpiChartProps {
  code: string;
  organizationName: string;
}

export default function KpiChart({ code, organizationName }: KpiChartProps) {
  const { t } = useTranslations();
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownSlice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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

      const res = await fetch(
        `/api/kpis/${encodeURIComponent(code)}/values?organization_name=${encodeURIComponent(
          organizationName
        )}`,
        { headers: { Authorization: `Bearer ${tokenData.token}` } }
      );

      if (!res.ok) throw new Error("fetch");
      const data = await res.json();

      setSeries(Array.isArray(data.series) ? data.series : []);
      setBreakdown(Array.isArray(data.breakdown) ? data.breakdown : []);
    } catch {
      setError(t("kpis.list.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [code, organizationName, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = series.map((point, index) => ({
    name:
      point.calculated_at && point.calculated_at !== "undefined"
        ? new Date(point.calculated_at).toLocaleDateString()
        : String(index + 1),
    value: point.value,
  }));

  const pieData = breakdown.map((slice) => ({
    name: slice.label,
    value: slice.value,
  }));

  const totalValue = pieData.reduce((sum, entry) => sum + entry.value, 0);

  const formatValue = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 2,
    }).format(value);

  if (isLoading) {
    return (
      <S.ChartBlock>
        <S.ChartHeader>{t("kpis.chart.title")}</S.ChartHeader>
        <S.LoadingRow>
          <S.Spinner />
          <S.LoadingText>{t("kpis.list.loading")}</S.LoadingText>
        </S.LoadingRow>
      </S.ChartBlock>
    );
  }

  if (error) {
    return (
      <S.ChartBlock>
        <S.ChartHeader>{t("kpis.chart.title")}</S.ChartHeader>
        <S.ErrorText>{error}</S.ErrorText>
      </S.ChartBlock>
    );
  }

  if (pieData.length === 0 && chartData.length === 0) {
    return (
      <S.ChartBlock>
        <S.ChartHeader>{t("kpis.chart.title")}</S.ChartHeader>
        <S.EmptyText>{t("kpis.chart.empty")}</S.EmptyText>
      </S.ChartBlock>
    );
  }

  return (
    <S.ChartBlock>
      <S.ChartHeader>{t("kpis.chart.title")}</S.ChartHeader>

      {pieData.length > 0 && (
        <S.ChartSection>
          <S.ChartTitle>{t("kpis.chart.distribution")}</S.ChartTitle>
          <S.ChartWrap>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={88}
                  dataKey="value"
                  nameKey="name"
                  animationDuration={1200}
                  animationBegin={200}
                  isAnimationActive
                  label={({ name, percent }) =>
                    percent != null && percent > 0.04
                      ? `${name}: ${(percent * 100).toFixed(0)}%`
                      : (name as string)
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [
                    formatValue(Number(value)),
                    t("kpis.chart.value"),
                  ]}
                  contentStyle={{
                    backgroundColor: "#11223D",
                    borderColor: "#1E2A44",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#E0F2FF" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </S.ChartWrap>
          <S.TotalRow>
            {t("kpis.chart.total")}: {formatValue(totalValue)}
          </S.TotalRow>
        </S.ChartSection>
      )}

      {chartData.length > 0 && (
        <S.ChartSection>
          <S.ChartTitle>{t("kpis.chart.trend")}</S.ChartTitle>
          <S.ChartWrap>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A44" />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: unknown) => [
                    formatValue(Number(value)),
                    t("kpis.chart.value"),
                  ]}
                  contentStyle={{
                    backgroundColor: "#11223c",
                    border: "1px solid #1E2A44",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#E0F2FF" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#22d3ee" }}
                  animationDuration={1200}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </S.ChartWrap>
        </S.ChartSection>
      )}
    </S.ChartBlock>
  );
}