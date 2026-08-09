"use client";

import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import KpiChart from "@/components/kpis/kpiChart/kpiChart";

interface KPI {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  aggregation: string;
  target_value: number | null;
  target_min: number | null;
  target_max: number | null;
  comparison_operator: string | null;
  alert_enabled: boolean | null;
  alert_threshold: number | null;
  alert_severity: string | null;
  reporting_period: string | null;
  lookback_days: number | null;
  status: string;
  last_value: number | null;
  last_variance_percentage: number | null;
  created_at: string;
  updated_at: string;
}

interface ListKpisProps {
  organizationName?: string;
  refreshKey?: number;
}

async function getFreshToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  return data.token;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr || "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(value: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    value
  );
}

export default function ListKpis({
  organizationName,
  refreshKey = 0,
}: ListKpisProps) {
  const { t } = useTranslations();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleKpi = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleKeyDown = (id: string, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleKpi(id);
    }
  };

  const fetchKpis = useCallback(async () => {
    const name = organizationName;
    if (!name) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = await getFreshToken();
      const params = new URLSearchParams({
        organization_name: name,
        order_by: "created_at",
        order_dir: "DESC",
        limit: "100",
      });

      const res = await fetch(`/api/kpis?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("kpis.list.loadError"));
        return;
      }

      setKpis(Array.isArray(data.data) ? data.data : []);
      setHasFetched(true);
    } catch {
      setError(t("kpis.list.serverError"));
    } finally {
      setIsLoading(false);
    }
  }, [organizationName, t]);

  useEffect(() => {
    if (organizationName) {
      fetchKpis();
    }
  }, [fetchKpis, refreshKey, organizationName]);

  if (isLoading && !hasFetched) {
    return (
      <S.Wrapper>
        <S.SkeletonCard>
          <S.SkeletonIcon />
          <S.SkeletonLines>
            <S.SkeletonLine $width="160px" />
            <S.SkeletonLine $width="240px" />
          </S.SkeletonLines>
        </S.SkeletonCard>
        <S.SkeletonCard>
          <S.SkeletonIcon />
          <S.SkeletonLines>
            <S.SkeletonLine $width="160px" />
            <S.SkeletonLine $width="240px" />
          </S.SkeletonLines>
        </S.SkeletonCard>
        <S.SkeletonCard>
          <S.SkeletonIcon />
          <S.SkeletonLines>
            <S.SkeletonLine $width="160px" />
            <S.SkeletonLine $width="240px" />
          </S.SkeletonLines>
        </S.SkeletonCard>
      </S.Wrapper>
    );
  }

  return (
    <S.Wrapper>
      <S.Header>
        <S.Title>{t("kpis.list.title")}</S.Title>
        {organizationName && (
          <S.Count>
            {t(
              kpis.length === 1
                ? "kpis.list.countOne"
                : "kpis.list.countMany",
              { count: kpis.length }
            )}
          </S.Count>
        )}
      </S.Header>

      {error && (
        <S.ErrorMessage>
          {error}
          <S.RetryButton onClick={fetchKpis}>
            {t("kpis.list.retry")}
          </S.RetryButton>
        </S.ErrorMessage>
      )}

      {!error && organizationName && !hasFetched && (
        <S.LoadingWrapper>
          <S.Spinner />
          <S.LoadingText>{t("kpis.list.loading")}</S.LoadingText>
        </S.LoadingWrapper>
      )}

      {!error && organizationName && hasFetched && kpis.length === 0 && (
        <S.Empty>
          <S.EmptyIcon>&#127919;</S.EmptyIcon>
          <S.EmptyText>{t("kpis.list.empty")}</S.EmptyText>
        </S.Empty>
      )}

      {kpis.length > 0 && (
        <S.Grid>
          {kpis.map((kpi, index) => {
            const isExpanded = expandedId === kpi.id;
            const hasTargetAbove = kpi.target_value != null;
            const hasTargetRange =
              kpi.target_min != null || kpi.target_max != null;
            const variance = kpi.last_variance_percentage;

            return (
              <S.CardItem key={kpi.id}>
                <S.Card
                  $index={index}
                  $expanded={isExpanded}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`kpi-details-${kpi.id}`}
                  onClick={() => toggleKpi(kpi.id)}
                  onKeyDown={(event) => handleKeyDown(kpi.id, event)}
                >
                  <S.CardLeft>
                    <S.KpiIcon>KPI</S.KpiIcon>
                    <S.CardInfo>
                      <S.KpiName>{kpi.name}</S.KpiName>
                      <S.KpiMeta>
                        <S.CodeTag $noDot>{kpi.code}</S.CodeTag>
                        <S.MetaTag $noDot>
                          {t(`kpis.creation.categories.${kpi.category}`)}
                        </S.MetaTag>
                        <S.MetaTag>
                          {t(`kpis.creation.units.${kpi.unit || "number"}`)}
                        </S.MetaTag>
                        <S.MetaTag>
                          {t("kpis.list.created", {
                            date: formatDate(kpi.created_at),
                          })}
                        </S.MetaTag>
                      </S.KpiMeta>
                    </S.CardInfo>
                  </S.CardLeft>
                  <S.CardRight>
                    {kpi.last_value != null && (
                      <S.MetaTag $noDot>
                        {t("kpis.list.lastValue")}: {kpi.last_value}
                      </S.MetaTag>
                    )}
                    <S.StatusBadge $status={kpi.status}>
                      {t(`kpis.list.statuses.${kpi.status || "draft"}`)}
                    </S.StatusBadge>
                    <S.Chevron $expanded={isExpanded} aria-hidden="true">
                      &#9662;
                    </S.Chevron>
                  </S.CardRight>
                </S.Card>

                <S.ChartPanel>
                  <KpiChart
                    code={kpi.code}
                    organizationName={organizationName || ""}
                  />
                </S.ChartPanel>

                {isExpanded && (
                  <S.DetailPanel id={`kpi-details-${kpi.id}`}>
                    <S.DetailDescription>
                      <S.DetailLabel>
                        {t("kpis.details.description")}
                      </S.DetailLabel>
                      <S.DetailText>
                        {kpi.description || t("kpis.details.noDescription")}
                      </S.DetailText>
                    </S.DetailDescription>

                    <S.DetailGrid>
                      <S.DetailItem>
                        <S.DetailLabel>
                          {t("kpis.details.aggregation")}
                        </S.DetailLabel>
                        <S.DetailValue>
                          {t(
                            `kpis.creation.aggregations.${
                              kpi.aggregation || "avg"
                            }`
                          )}
                        </S.DetailValue>
                      </S.DetailItem>

                      <S.DetailItem>
                        <S.DetailLabel>
                          {t("kpis.details.reportingPeriod")}
                        </S.DetailLabel>
                        <S.DetailValue>
                          {t(
                            `kpis.creation.periods.${
                              kpi.reporting_period || "daily"
                            }`
                          )}
                        </S.DetailValue>
                      </S.DetailItem>

                      <S.DetailItem>
                        <S.DetailLabel>
                          {t("kpis.details.lookbackDays")}
                        </S.DetailLabel>
                        <S.DetailValue>
                          {formatValue(kpi.lookback_days)}
                        </S.DetailValue>
                      </S.DetailItem>

                      <S.DetailItem>
                        <S.DetailLabel>{t("kpis.details.target")}</S.DetailLabel>
                        <S.DetailValue>
                          {hasTargetAbove
                            ? formatValue(kpi.target_value)
                            : hasTargetRange
                            ? `${formatValue(kpi.target_min)} – ${formatValue(
                                kpi.target_max
                              )}`
                            : t("kpis.details.noTarget")}
                        </S.DetailValue>
                      </S.DetailItem>

                      {kpi.comparison_operator && (
                        <S.DetailItem>
                          <S.DetailLabel>
                            {t("kpis.details.comparison")}
                          </S.DetailLabel>
                          <S.DetailValue>
                            {t(
                              `kpis.creation.operators.${kpi.comparison_operator}`
                            )}
                          </S.DetailValue>
                        </S.DetailItem>
                      )}

                      <S.DetailItem>
                        <S.DetailLabel>{t("kpis.details.alert")}</S.DetailLabel>
                        <S.DetailValue>
                          {kpi.alert_enabled
                            ? t("kpis.details.alertEnabled")
                            : t("kpis.details.alertDisabled")}
                          {kpi.alert_enabled &&
                            kpi.alert_threshold != null &&
                            ` \u00b7 ${t("kpis.details.alertThreshold")}: ${formatValue(
                              kpi.alert_threshold
                            )}`}
                          {kpi.alert_enabled && kpi.alert_severity && (
                            <>
                              {" \u00b7 "}
                              <S.SeverityChip $severity={kpi.alert_severity}>
                                {t(
                                  `kpis.creation.severities.${kpi.alert_severity}`
                                )}
                              </S.SeverityChip>
                            </>
                          )}
                        </S.DetailValue>
                      </S.DetailItem>
                    </S.DetailGrid>

                    <S.DetailFooter>
                      <S.FooterStat>
                        <S.DetailLabel>
                          {t("kpis.details.lastValue")}
                        </S.DetailLabel>
                        <S.FooterValue>
                          {formatValue(kpi.last_value)}
                        </S.FooterValue>
                      </S.FooterStat>
                      <S.FooterDivider />
                      <S.FooterStat>
                        <S.DetailLabel>
                          {t("kpis.details.lastVariance")}
                        </S.DetailLabel>
                        <S.FooterValue $positive={(variance ?? 0) >= 0}>
                          {variance != null
                            ? `${variance >= 0 ? "+" : ""}${formatValue(
                                variance
                              )}%`
                            : "-"}
                        </S.FooterValue>
                      </S.FooterStat>
                      <S.FooterDivider />
                      <S.FooterStat>
                        <S.DetailLabel>
                          {t("kpis.details.updatedAt")}
                        </S.DetailLabel>
                        <S.FooterValue>
                          {formatDate(kpi.updated_at)}
                        </S.FooterValue>
                      </S.FooterStat>
                    </S.DetailFooter>
                  </S.DetailPanel>
                )}
              </S.CardItem>
            );
          })}
        </S.Grid>
      )}
    </S.Wrapper>
  );
}