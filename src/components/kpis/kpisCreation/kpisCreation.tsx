"use client";

import { useState, FormEvent } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

const CATEGORIES = [
  "revenue_profitability",
  "financial_health",
  "growth_trends",
  "customer_value",
  "operational_efficiency",
  "retention_expansion",
  "forecasting_predictive",
];
const UNITS = ["percentage", "currency", "number", "ratio", "days", "rating", "boolean"];
const AGGREGATIONS = ["sum", "avg", "count", "min", "max"];
const COMPARISON_OPERATORS = [
  "greater_than",
  "greater_equal",
  "less_than",
  "less_equal",
  "equal_to",
  "between",
];
const REPORTING_PERIODS = [
  "realtime",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
];
const ALERT_SEVERITIES = ["low", "medium", "high", "critical"];

async function getToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  return data.token;
}

export default function KPIsCreation({
  organizationName = "",
  onSuccess,
}: {
  organizationName?: string;
  onSuccess?: (organization_name: string) => void;
}) {
  const { t } = useTranslations();

  const [form, setForm] = useState({
    organization_name: organizationName,
    code: "",
    name: "",
    description: "",
    category: "revenue_profitability",
    unit: "number",
    aggregation: "sum",
    comparison_method: "greater_than",
    target_value: "",
    target_min: "",
    target_max: "",
    reporting_period: "monthly",
    alert_enabled: false,
    alert_threshold: "",
    alert_severity: "medium",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/kpis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: form.organization_name,
          code: form.code,
          name: form.name,
          description: form.description,
          category: form.category,
          unit: form.unit || "number",
          aggregation: form.aggregation,
          comparison_operator: form.comparison_method,
          target_value: form.target_value ? Number(form.target_value) : null,
          target_min: form.target_min ? Number(form.target_min) : null,
          target_max: form.target_max ? Number(form.target_max) : null,
          reporting_period: form.reporting_period,
          alert_enabled: form.alert_enabled,
          alert_threshold: form.alert_threshold
            ? Number(form.alert_threshold)
            : null,
          alert_severity: form.alert_severity,
          lookback_days: 30,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || t("kpis.creation.error"),
        });
        return;
      }

      setMessage({
        type: "success",
        text: t("kpis.creation.success"),
      });
      onSuccess?.(form.organization_name);
    } catch {
      setMessage({ type: "error", text: t("kpis.creation.error") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <S.Wrapper>
      <S.Card onSubmit={handleSubmit}>
        <S.Header>
          <S.Title>{t("kpis.creation.title")}</S.Title>
          <S.Subtitle>{t("kpis.creation.subtitle")}</S.Subtitle>
        </S.Header>

        {message && (
          <S.Message $type={message.type}>
            {message.type === "success" ? "\u2713" : "\u2717"} {message.text}
          </S.Message>
        )}

        <S.SectionTitle>{t("kpis.creation.sectionBasic")}</S.SectionTitle>

        <S.Field>
          <S.Label htmlFor="organization_name">
            {t("kpis.creation.organizationName")} <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            id="organization_name"
            type="text"
            placeholder={t("kpis.creation.organizationPlaceholder")}
            value={form.organization_name}
            onChange={(e) => updateField("organization_name", e.target.value)}
            required
          />
        </S.Field>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="code">
              {t("kpis.creation.code")} <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              id="code"
              type="text"
              placeholder={t("kpis.creation.codePlaceholder")}
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
              required
            />
          </S.Field>

          <S.Field>
            <S.Label htmlFor="name">
              {t("kpis.creation.name")} <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              id="name"
              type="text"
              placeholder={t("kpis.creation.namePlaceholder")}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </S.Field>
        </S.Row>

        <S.Field>
          <S.Label htmlFor="description">{t("kpis.creation.description")}</S.Label>
          <S.TextArea
            id="description"
            placeholder={t("kpis.creation.descriptionPlaceholder")}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </S.Field>

        <S.Divider />

        <S.SectionTitle>{t("kpis.creation.sectionParameters")}</S.SectionTitle>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="category">
              {t("kpis.creation.category")} <S.Required>*</S.Required>
            </S.Label>
            <S.Select
              id="category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`kpis.creation.categories.${c}`)}
                </option>
              ))}
            </S.Select>
          </S.Field>

          <S.Field>
            <S.Label htmlFor="unit">{t("kpis.creation.unit")}</S.Label>
            <S.Select
              id="unit"
              value={form.unit}
              onChange={(e) => updateField("unit", e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`kpis.creation.units.${u}`)}
                </option>
              ))}
            </S.Select>
          </S.Field>
        </S.Row>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="aggregation">
              {t("kpis.creation.aggregation")}
            </S.Label>
            <S.Select
              id="aggregation"
              value={form.aggregation}
              onChange={(e) => updateField("aggregation", e.target.value)}
            >
              {AGGREGATIONS.map((a) => (
                <option key={a} value={a}>
                  {t(`kpis.creation.aggregations.${a}`)}
                </option>
              ))}
            </S.Select>
          </S.Field>

          <S.Field>
            <S.Label htmlFor="reporting_period">
              {t("kpis.creation.reportingPeriod")}
            </S.Label>
            <S.Select
              id="reporting_period"
              value={form.reporting_period}
              onChange={(e) => updateField("reporting_period", e.target.value)}
            >
              {REPORTING_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {t(`kpis.creation.periods.${p}`)}
                </option>
              ))}
            </S.Select>
          </S.Field>
        </S.Row>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="comparison_method">
              {t("kpis.creation.comparison")}
            </S.Label>
            <S.Select
              id="comparison_method"
              value={form.comparison_method}
              onChange={(e) => updateField("comparison_method", e.target.value)}
            >
              {COMPARISON_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {t(`kpis.creation.operators.${op}`)}
                </option>
              ))}
            </S.Select>
          </S.Field>

          <S.Field>
            <S.Label htmlFor="target_value">{t("kpis.creation.targetValue")}</S.Label>
            <S.Input
              id="target_value"
              type="number"
              placeholder={t("kpis.creation.targetPlaceholder")}
              value={form.target_value}
              onChange={(e) => updateField("target_value", e.target.value)}
            />
          </S.Field>
        </S.Row>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="target_min">{t("kpis.creation.targetMin")}</S.Label>
            <S.Input
              id="target_min"
              type="number"
              placeholder={t("kpis.creation.targetMinPlaceholder")}
              value={form.target_min}
              onChange={(e) => updateField("target_min", e.target.value)}
            />
          </S.Field>

          <S.Field>
            <S.Label htmlFor="target_max">{t("kpis.creation.targetMax")}</S.Label>
            <S.Input
              id="target_max"
              type="number"
              placeholder={t("kpis.creation.targetMaxPlaceholder")}
              value={form.target_max}
              onChange={(e) => updateField("target_max", e.target.value)}
            />
          </S.Field>
        </S.Row>

        <S.Divider />

        <S.SectionTitle>{t("kpis.creation.sectionAlerts")}</S.SectionTitle>

        <S.Checkbox>
          <input
            type="checkbox"
            checked={form.alert_enabled}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, alert_enabled: e.target.checked }));
              setMessage(null);
            }}
          />
          {t("kpis.creation.alertEnabled")}
        </S.Checkbox>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="alert_threshold">
              {t("kpis.creation.alertThreshold")}
            </S.Label>
            <S.Input
              id="alert_threshold"
              type="number"
              placeholder={t("kpis.creation.alertThresholdPlaceholder")}
              value={form.alert_threshold}
              onChange={(e) => updateField("alert_threshold", e.target.value)}
            />
          </S.Field>

          <S.Field>
            <S.Label htmlFor="alert_severity">
              {t("kpis.creation.alertSeverity")}
            </S.Label>
            <S.Select
              id="alert_severity"
              value={form.alert_severity}
              onChange={(e) => updateField("alert_severity", e.target.value)}
            >
              {ALERT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {t(`kpis.creation.severities.${s}`)}
                </option>
              ))}
            </S.Select>
          </S.Field>
        </S.Row>

        <S.Actions>
          <S.Button
            type="submit"
            $variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <S.Spinner /> {t("kpis.creation.creating")}
              </>
            ) : (
              t("kpis.creation.createKpi")
            )}
          </S.Button>
        </S.Actions>
      </S.Card>
    </S.Wrapper>
  );
}