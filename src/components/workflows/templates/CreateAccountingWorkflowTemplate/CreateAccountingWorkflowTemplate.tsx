"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { WorkflowDefinition } from "../workflowTypes";
import WorkflowDesigner from "../workflowDesigner/workflowDesigner";
import WorkflowTemplate1, { TEMPLATE_1_DEFINITION } from "../workflowTemplate1/workflowTemplate1";
import WorkflowTemplate2, { TEMPLATE_2_DEFINITION } from "../workflowTemplate2/workflowTemplate2";

const EMPTY_DEFINITION: WorkflowDefinition = {
  nodes: [],
  edges: [],
  metadata: { name: "", description: "", tags: [] },
};

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

type View = "select" | "designer";

export default function CreateAccountingWorkflowTemplate() {
  const { t } = useTranslations();
  const [view, setView] = useState<View>("select");
  const [definition, setDefinition] = useState<WorkflowDefinition>(EMPTY_DEFINITION);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [fiscalPeriod, setFiscalPeriod] = useState("");
  const [regulatoryBody, setRegulatoryBody] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function selectTemplate(def: WorkflowDefinition) {
    setName(def.metadata?.name || "");
    setDefinition(JSON.parse(JSON.stringify(def)));
    setView("designer");
  }

  function startFromScratch() {
    setDefinition({
      nodes: [],
      edges: [],
      metadata: { name: "", description: "" },
    });
    setName("");
    setView("designer");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) { setError("Workflow name is required"); return; }
    if (!category) { setError("Category is required"); return; }
    if (definition.nodes.length < 2) { setError("Workflow must have at least 2 steps"); return; }

    const workflowDefinition = {
      ...definition,
      metadata: {
        ...definition.metadata,
        name: name.trim(),
      },
    };

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
          workflow_definition: workflowDefinition,
          structure: {
            stages: definition.nodes.map((n) => ({
              name: n.label,
              probability: n.type === "start" ? 100 : n.type === "end" ? 0 : 50,
              document_required: false,
              approval_required: n.type === "decision",
            })),
            kpis: ["completion_rate"],
            compliance_checks: ["document_validation"],
            audit_requirements: ["audit_trail"],
            deadlines: { has_statutory_deadline: false, fiscal_period: "monthly" },
          },
          tax_regime: taxRegime || undefined,
          fiscal_period: fiscalPeriod || undefined,
          regulatory_body: regulatoryBody || undefined,
          created_by: createdBy.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create workflow template");
        setSaving(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setSaving(false);
  }

  if (view === "designer") {
    return (
      <S.PageWrapper>
        <S.Container>
          <S.BackButton onClick={() => setView("select")}>← Back to templates</S.BackButton>

          <S.Form onSubmit={handleSubmit}>
            <S.FormGrid>
              <S.Field>
                <S.Label>Name <S.Required>*</S.Required></S.Label>
                <S.Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Tax Compliance" />
              </S.Field>
              <S.Field>
                <S.Label>Category <S.Required>*</S.Required></S.Label>
                <S.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{labelize(c)}</option>
                  ))}
                </S.Select>
              </S.Field>
              <S.Field>
                <S.Label>Tax Regime</S.Label>
                <S.Select value={taxRegime} onChange={(e) => setTaxRegime(e.target.value)}>
                  <option value="">Select tax regime</option>
                  {TAX_REGIMES.map((r) => (
                    <option key={r} value={r}>{labelize(r)}</option>
                  ))}
                </S.Select>
              </S.Field>
              <S.Field>
                <S.Label>Fiscal Period</S.Label>
                <S.Select value={fiscalPeriod} onChange={(e) => setFiscalPeriod(e.target.value)}>
                  <option value="">Select period</option>
                  {FISCAL_PERIODS.map((p) => (
                    <option key={p} value={p}>{labelize(p)}</option>
                  ))}
                </S.Select>
              </S.Field>
              <S.Field>
                <S.Label>Regulatory Body</S.Label>
                <S.Select value={regulatoryBody} onChange={(e) => setRegulatoryBody(e.target.value)}>
                  <option value="">Select body</option>
                  {REGULATORY_BODIES.map((b) => (
                    <option key={b} value={b}>{labelize(b)}</option>
                  ))}
                </S.Select>
              </S.Field>
              <S.Field>
                <S.Label>Created By</S.Label>
                <S.Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="e.g. John Doe" />
              </S.Field>
            </S.FormGrid>

            {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
            {success && <S.SuccessMessage>Workflow template created successfully!</S.SuccessMessage>}

            <S.DesignerSection>
              <S.DesignerLabel>Workflow Designer <S.Required>*</S.Required></S.DesignerLabel>
              <WorkflowDesigner
                definition={definition}
                onChange={setDefinition}
              />
            </S.DesignerSection>

            <S.Actions>
              <S.Button type="button" $variant="ghost" onClick={() => {
                setName("");
                setCategory("");
                setTaxRegime("");
                setFiscalPeriod("");
                setRegulatoryBody("");
                setCreatedBy("");
                setDefinition(EMPTY_DEFINITION);
                setError("");
                setSuccess(false);
              }}>
                Cancel
              </S.Button>
              <S.Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Workflow Template"}
              </S.Button>
            </S.Actions>
          </S.Form>
        </S.Container>
      </S.PageWrapper>
    );
  }

  return (
    <S.PageWrapper>
      <S.Container>
        <S.Title>Create Accounting Workflow Template</S.Title>
        <S.Subtitle>Select a predefined template or start from scratch</S.Subtitle>

        <S.TemplateGrid>
          <WorkflowTemplate1 onSelect={selectTemplate} />
          <WorkflowTemplate2 onSelect={selectTemplate} />
        </S.TemplateGrid>

        <S.Divider>or</S.Divider>

        <S.CustomButton onClick={startFromScratch}>
          Start from Scratch
        </S.CustomButton>
      </S.Container>
    </S.PageWrapper>
  );
}
