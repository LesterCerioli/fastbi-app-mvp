"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import StructureBuilder from "@/components/accounting/structureBuilder/structureBuilder";

const CATEGORIES = [
  "bookkeeping", "tax_compliance", "auditing", "financial_reporting",
  "accounts_payable", "accounts_receivable", "payroll", "fiscal_obligations",
  "treasury", "budgeting", "cost_accounting", "asset_management",
  "tax_planning", "internal_controls", "reconciliation", "closing",
  "transfer_pricing", "tax_audit", "regulatory_compliance", "financial_analysis",
];

const TAX_REGIMES = ["simplified", "presumed_profit", "actual_profit", "individual_micro_entrepreneur", "international"];
const FISCAL_PERIODS = ["monthly", "quarterly", "semester", "annual", "custom"];
const REGULATORY_BODIES = [
  "federal_revenue", "finance_secretariat", "securities_commission", "central_bank",
  "internal_revenue_service", "accountancy_council", "chief_financial_officer", "sec", "irs", "hmrc",
];

function labelize(key: string) {
  return key.replace(/_/g, " ");
}

interface FormData {
  name: string;
  category: string;
  structure: string;
  taxRegime: string;
  fiscalPeriod: string;
  regulatoryBody: string;
  createdBy: string;
}

const defaultStructure = JSON.stringify(
  {
    stages: [
      { name: "Initial Review", probability: 100, document_required: false, approval_required: false },
      { name: "Document Collection", probability: 80, document_required: true, approval_required: false },
    ],
    kpis: ["completion_rate"],
    compliance_checks: ["document_validation"],
    audit_requirements: ["audit_trail"],
    deadlines: { has_statutory_deadline: false, fiscal_period: "monthly" },
  },
  null,
  2
);

export default function CreateAccountingTemplate() {
  const { t } = useTranslations();
  const [form, setForm] = useState<FormData>({
    name: "",
    category: "",
    structure: defaultStructure,
    taxRegime: "",
    fiscalPeriod: "",
    regulatoryBody: "",
    createdBy: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { name, category, structure, taxRegime, fiscalPeriod, regulatoryBody, createdBy } = form;

    if (!name.trim()) { setError(t("accounting.template.errors.nameRequired")); return; }
    if (!category) { setError(t("accounting.template.errors.categoryRequired")); return; }

    let parsedStructure;
    try {
      parsedStructure = JSON.parse(structure);
    } catch {
      setError(t("accounting.template.errors.invalidJson"));
      return;
    }

    if (!parsedStructure.stages || parsedStructure.stages.length < 2) {
      setError(t("accounting.template.errors.minStages"));
      return;
    }
    if (!parsedStructure.kpis || parsedStructure.kpis.length === 0) {
      setError(t("accounting.template.errors.minKpis"));
      return;
    }

    setSaving(true);

    try {
      const tokenRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!tokenRes.ok) throw new Error("Token failed");
      const { token } = await tokenRes.json();

      const res = await fetch("/api/accountingworkflow/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          structure: parsedStructure,
          tax_regime: taxRegime || undefined,
          fiscal_period: fiscalPeriod || undefined,
          regulatory_body: regulatoryBody || undefined,
          created_by: createdBy.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("accounting.template.errors.createFailed"));
        setSaving(false);
        return;
      }

      setSuccess(true);
      setForm({ name: "", category: "", structure: defaultStructure, taxRegime: "", fiscalPeriod: "", regulatoryBody: "", createdBy: "" });
    } catch (err: any) {
      setError(err.message || t("accounting.template.errors.generic"));
    }
    setSaving(false);
  }

  return (
    <S.Container>
      <S.Card>
        <S.Title>{t("accounting.template.title")}</S.Title>
        <S.Subtitle>{t("accounting.template.subtitle")}</S.Subtitle>

        {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
        {success && <S.SuccessMessage>{t("accounting.template.success")}</S.SuccessMessage>}

        <form onSubmit={handleSubmit}>
          <S.Grid>
            <S.FullRow>
              <S.Field>
                <S.Label>{t("accounting.template.fields.name.label")} <S.Required>*</S.Required></S.Label>
                <S.Input
                  placeholder={t("accounting.template.fields.name.placeholder")}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </S.Field>
            </S.FullRow>

            <S.Field>
              <S.Label>{t("accounting.template.fields.category.label")} <S.Required>*</S.Required></S.Label>
              <S.Select value={form.category} onChange={(e) => update("category", e.target.value)}>
                <option value="">{t("accounting.template.fields.category.placeholder")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{labelize(c)}</option>
                ))}
              </S.Select>
            </S.Field>

            <S.Field>
              <S.Label>{t("accounting.template.fields.taxRegime.label")}</S.Label>
              <S.Select value={form.taxRegime} onChange={(e) => update("taxRegime", e.target.value)}>
                <option value="">{t("accounting.template.fields.taxRegime.placeholder")}</option>
                {TAX_REGIMES.map((r) => (
                  <option key={r} value={r}>{labelize(r)}</option>
                ))}
              </S.Select>
            </S.Field>

            <S.Field>
              <S.Label>{t("accounting.template.fields.fiscalPeriod.label")}</S.Label>
              <S.Select value={form.fiscalPeriod} onChange={(e) => update("fiscalPeriod", e.target.value)}>
                <option value="">{t("accounting.template.fields.fiscalPeriod.placeholder")}</option>
                {FISCAL_PERIODS.map((p) => (
                  <option key={p} value={p}>{labelize(p)}</option>
                ))}
              </S.Select>
            </S.Field>

            <S.Field>
              <S.Label>{t("accounting.template.fields.regulatoryBody.label")}</S.Label>
              <S.Select value={form.regulatoryBody} onChange={(e) => update("regulatoryBody", e.target.value)}>
                <option value="">{t("accounting.template.fields.regulatoryBody.placeholder")}</option>
                {REGULATORY_BODIES.map((b) => (
                  <option key={b} value={b}>{labelize(b)}</option>
                ))}
              </S.Select>
            </S.Field>

            <S.Field>
              <S.Label>{t("accounting.template.fields.createdBy.label")}</S.Label>
              <S.Input
                placeholder={t("accounting.template.fields.createdBy.placeholder")}
                value={form.createdBy}
                onChange={(e) => update("createdBy", e.target.value)}
              />
            </S.Field>

            <S.FullRow>
              <S.Field>
                <S.Label>{t("accounting.template.fields.structure.label")} <S.Required>*</S.Required></S.Label>
                <StructureBuilder
                  value={form.structure}
                  onChange={(json) => update("structure", json)}
                />
                <S.TextArea
                  value={form.structure}
                  onChange={(e) => update("structure", e.target.value)}
                  placeholder={t("accounting.template.fields.structure.placeholder")}
                  style={{ marginTop: 12 }}
                />
              </S.Field>
            </S.FullRow>
          </S.Grid>

          <S.Actions>
            <S.Button type="button" $variant="ghost" onClick={() => {
              setForm({ name: "", category: "", structure: defaultStructure, taxRegime: "", fiscalPeriod: "", regulatoryBody: "", createdBy: "" });
              setError("");
              setSuccess(false);
            }}>
              {t("accounting.template.buttons.cancel")}
            </S.Button>
            <S.Button type="submit" disabled={saving}>
              {saving ? t("accounting.template.buttons.creating") : t("accounting.template.buttons.create")}
            </S.Button>
          </S.Actions>
        </form>
      </S.Card>
    </S.Container>
  );
}
