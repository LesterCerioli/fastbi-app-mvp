import { query } from "../db";

export const AllowedAccountingCategories = [
  "bookkeeping", "tax_compliance", "auditing", "financial_reporting",
  "accounts_payable", "accounts_receivable", "payroll", "fiscal_obligations",
  "treasury", "budgeting", "cost_accounting", "asset_management",
  "tax_planning", "internal_controls", "reconciliation", "closing",
  "transfer_pricing", "tax_audit", "regulatory_compliance", "financial_analysis",
];

export const FiscalPeriods = ["monthly", "quarterly", "semester", "annual", "custom"];

export const TaxRegimes = ["simples_nacional", "lucro_presumido", "lucro_real", "mei", "international"];

export const RegulatoryBodies = [
  "receita_federal", "secretaria_fazenda", "cvm", "bacen",
  "irb", "crc", "cfo", "sec", "irs", "hmrc",
];

export interface AccountingWorkflowStage {
  name: string;
  probability: number;
  document_required?: boolean;
  approval_required?: boolean;
  fiscal_obligation?: boolean;
}

export interface DeadlinesConfig {
  has_statutory_deadline: boolean;
  fiscal_period: string;
  deadline_days?: number;
}

export interface FiscalContext {
  fiscal_year: number;
  fiscal_period: string;
  organization_id: string;
  created_from_template: string;
}

export interface AccountingWorkflowStructure {
  stages: AccountingWorkflowStage[];
  kpis: string[];
  compliance_checks?: string[];
  audit_requirements?: string[];
  deadlines?: DeadlinesConfig;
  documents_required?: string[];
  approval_flow?: string[];
  audit?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  fiscal_context?: FiscalContext;
  customizations?: Record<string, unknown>;
}

export interface AccountingWorkflowTemplate {
  id: string;
  name: string;
  category: string;
  tax_regime?: string;
  fiscal_period?: string;
  regulatory_body?: string;
  structure: AccountingWorkflowStructure;
  workflow_definition?: Record<string, unknown>;
  description?: string;
  tags?: string[];
  version?: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AccountingWorkflow {
  id: string;
  organization_id: string;
  name: string;
  template_id: string;
  fiscal_year: number;
  fiscal_period: string;
  structure: AccountingWorkflowStructure;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceObligation {
  template_name: string;
  category: string;
  fiscal_period: string;
  deadlines: Record<string, unknown>;
  status: string;
}

export interface ComplianceCalendar {
  fiscal_year: number;
  organization_id: string;
  obligations: ComplianceObligation[];
}

export class AccountingWorkflowEngineService {
  private async getOrganizationIDByName(organizationName: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1 AND deleted_at IS NULL`,
      [organizationName]
    );
    if (!result.rows[0]) {
      throw new Error(`organization '${organizationName}' not found`);
    }
    return result.rows[0].id;
  }

  private validateWorkflowStructure(structure: AccountingWorkflowStructure): void {
    if (structure.stages.length < 2) {
      throw new Error("workflow must have at least 2 stages");
    }
    for (const stage of structure.stages) {
      if (!stage.name) {
        throw new Error("stage must have a name");
      }
      if (stage.probability < 0 || stage.probability > 100) {
        throw new Error("probability must be between 0 and 100");
      }
    }
    if (structure.kpis.length === 0) {
      throw new Error("workflow must define KPIs");
    }
  }

  private isValid(value: string | undefined | null, allowed: string[]): boolean {
    if (!value) return false;
    return allowed.includes(value);
  }

  async createTemplate(
    name: string,
    category: string,
    structure: AccountingWorkflowStructure,
    createdBy?: string,
    taxRegime?: string,
    fiscalPeriod?: string,
    regulatoryBody?: string,
    workflowDefinition?: Record<string, unknown>,
    description?: string,
    tags?: string[],
  ): Promise<AccountingWorkflowTemplate> {
    if (!name) throw new Error("template name is required");
    if (!this.isValid(category, AllowedAccountingCategories)) {
      throw new Error(`invalid category: ${category}`);
    }
    if (taxRegime && !this.isValid(taxRegime, TaxRegimes)) {
      throw new Error(`invalid tax regime: ${taxRegime}`);
    }
    if (fiscalPeriod && !this.isValid(fiscalPeriod, FiscalPeriods)) {
      throw new Error(`invalid fiscal period: ${fiscalPeriod}`);
    }
    if (regulatoryBody && !this.isValid(regulatoryBody, RegulatoryBodies)) {
      throw new Error(`invalid regulatory body: ${regulatoryBody}`);
    }

    if (!structure.compliance_checks) {
      structure.compliance_checks = ["document_validation", "tax_calculation_verification"];
    }
    if (!structure.audit_requirements) {
      structure.audit_requirements = ["audit_trail", "segregation_of_duties"];
    }
    if (!structure.deadlines) {
      structure.deadlines = { has_statutory_deadline: false, fiscal_period: "monthly" };
    }
    if (!structure.metadata) {
      structure.metadata = {};
    }
    if (taxRegime) structure.metadata["tax_regime"] = taxRegime;
    if (fiscalPeriod) structure.metadata["fiscal_period"] = fiscalPeriod;
    if (regulatoryBody) structure.metadata["regulatory_body"] = regulatoryBody;
    structure.metadata["created_by_service"] = "AccountingWorkflowEngineService";

    this.validateWorkflowStructure(structure);

    const dbTags = tags && tags.length > 0 ? tags : null;

    const result = await query(
      `INSERT INTO public.accounting_workflow_templates (
        name, category, tax_regime, fiscal_period, regulatory_body,
        structure_json, workflow_definition, description, tags, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, category, tax_regime, fiscal_period, regulatory_body,
                structure_json, workflow_definition, description, tags, created_by, created_at, updated_at`,
      [name, category, taxRegime || null, fiscalPeriod || null, regulatoryBody || null,
       JSON.stringify(structure), workflowDefinition ? JSON.stringify(workflowDefinition) : null,
       description || null, dbTags, createdBy || null]
    );
    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      tax_regime: row.tax_regime || undefined,
      fiscal_period: row.fiscal_period || undefined,
      regulatory_body: row.regulatory_body || undefined,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      workflow_definition: row.workflow_definition ? (typeof row.workflow_definition === "string" ? JSON.parse(row.workflow_definition) : row.workflow_definition) : undefined,
      description: row.description || undefined,
      tags: row.tags || undefined,
      version: row.version || 1,
      created_by: row.created_by || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async createWorkflowFromTemplate(
    templateID: string,
    organizationName: string,
    fiscalYear: number,
    fiscalPeriod?: string,
    name?: string,
    customization?: Record<string, unknown>,
  ): Promise<AccountingWorkflow> {
    const tmplResult = await query(
      `SELECT structure_json, name, fiscal_period FROM public.accounting_workflow_templates WHERE id = $1`,
      [templateID]
    );
    if (!tmplResult.rows[0]) {
      throw new Error(`accounting workflow template not found: ${templateID}`);
    }
    const templateRow = tmplResult.rows[0];

    const structure: AccountingWorkflowStructure =
      typeof templateRow.structure_json === "string"
        ? JSON.parse(templateRow.structure_json)
        : templateRow.structure_json;

    const period = fiscalPeriod || templateRow.fiscal_period || "monthly";
    const organizationID = await this.getOrganizationIDByName(organizationName);

    structure.fiscal_context = {
      fiscal_year: fiscalYear,
      fiscal_period: period,
      organization_id: organizationID,
      created_from_template: templateID,
    };

    if (customization) {
      if (customization.stages) structure.stages = customization.stages as AccountingWorkflowStage[];
      if (customization.kpis) structure.kpis = customization.kpis as string[];
      if (customization.compliance_checks) structure.compliance_checks = customization.compliance_checks as string[];
      structure.customizations = customization;
    }

    const workflowName = name || templateRow.name;

    const result = await query(
      `INSERT INTO public.accounting_workflows (
        organization_id, name, template_id, fiscal_year, fiscal_period,
        structure_json, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, organization_id, name, template_id, fiscal_year, fiscal_period,
                structure_json, status, created_at, updated_at`,
      [organizationID, workflowName, templateID, fiscalYear, period,
       JSON.stringify(structure), "pending"]
    );
    const row = result.rows[0];

    return {
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      template_id: row.template_id,
      fiscal_year: row.fiscal_year,
      fiscal_period: row.fiscal_period,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getTemplatesByCategory(category: string): Promise<AccountingWorkflowTemplate[]> {
    if (!this.isValid(category, AllowedAccountingCategories)) {
      throw new Error(`invalid category: ${category}`);
    }

    const result = await query(
      `SELECT id, name, category, tax_regime, fiscal_period, regulatory_body,
              structure_json, created_by, created_at, updated_at
       FROM public.accounting_workflow_templates
       WHERE category = $1
       ORDER BY created_at DESC`,
      [category]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      tax_regime: row.tax_regime || undefined,
      fiscal_period: row.fiscal_period || undefined,
      regulatory_body: row.regulatory_body || undefined,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      created_by: row.created_by || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getTemplatesByTaxRegime(taxRegime: string): Promise<AccountingWorkflowTemplate[]> {
    if (!this.isValid(taxRegime, TaxRegimes)) {
      throw new Error(`invalid tax regime: ${taxRegime}`);
    }

    const result = await query(
      `SELECT id, name, category, tax_regime, fiscal_period, regulatory_body,
              structure_json, created_by, created_at, updated_at
       FROM public.accounting_workflow_templates
       WHERE tax_regime = $1
       ORDER BY created_at DESC`,
      [taxRegime]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      tax_regime: row.tax_regime || undefined,
      fiscal_period: row.fiscal_period || undefined,
      regulatory_body: row.regulatory_body || undefined,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      created_by: row.created_by || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getWorkflowsByFiscalPeriod(
    organizationName: string,
    fiscalYear: number,
    fiscalPeriod?: string,
  ): Promise<AccountingWorkflow[]> {
    const organizationID = await this.getOrganizationIDByName(organizationName);

    let sql = `SELECT id, organization_id, name, template_id, fiscal_year, fiscal_period,
                      structure_json, status, created_at, updated_at
               FROM public.accounting_workflows
               WHERE organization_id = $1 AND fiscal_year = $2`;
    const params: unknown[] = [organizationID, fiscalYear];

    if (fiscalPeriod) {
      sql += ` AND fiscal_period = $3`;
      params.push(fiscalPeriod);
    }
    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);

    return result.rows.map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      template_id: row.template_id,
      fiscal_year: row.fiscal_year,
      fiscal_period: row.fiscal_period,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async resolveTemplateIDByName(name: string, category: string): Promise<string> {
    if (!name) throw new Error("template_name is required");
    if (!category) throw new Error("template_category is required");

    const result = await query(
      `SELECT id FROM public.accounting_workflow_templates WHERE name = $1 AND category = $2`,
      [name, category]
    );
    if (!result.rows[0]) {
      throw new Error(`accounting template not found: name=${name} category=${category}`);
    }
    return result.rows[0].id;
  }

  async updateTemplate(
    templateID: string,
    updates: {
      name?: string;
      category?: string;
      structure?: AccountingWorkflowStructure;
      taxRegime?: string;
      fiscalPeriod?: string;
    },
  ): Promise<AccountingWorkflowTemplate> {
    const checkResult = await query(
      `SELECT id FROM public.accounting_workflow_templates WHERE id = $1`,
      [templateID]
    );
    if (!checkResult.rows[0]) {
      throw new Error(`template not found: ${templateID}`);
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (updates.name) {
      setClauses.push(`name = $${paramIdx++}`);
      params.push(updates.name);
    }
    if (updates.category) {
      if (!this.isValid(updates.category, AllowedAccountingCategories)) {
        throw new Error(`invalid category: ${updates.category}`);
      }
      setClauses.push(`category = $${paramIdx++}`);
      params.push(updates.category);
    }
    if (updates.taxRegime) {
      if (!this.isValid(updates.taxRegime, TaxRegimes)) {
        throw new Error(`invalid tax regime: ${updates.taxRegime}`);
      }
      setClauses.push(`tax_regime = $${paramIdx++}`);
      params.push(updates.taxRegime);
    }
    if (updates.fiscalPeriod) {
      if (!this.isValid(updates.fiscalPeriod, FiscalPeriods)) {
        throw new Error(`invalid fiscal period: ${updates.fiscalPeriod}`);
      }
      setClauses.push(`fiscal_period = $${paramIdx++}`);
      params.push(updates.fiscalPeriod);
    }
    if (updates.structure) {
      this.validateWorkflowStructure(updates.structure);
      setClauses.push(`structure_json = $${paramIdx++}`);
      params.push(JSON.stringify(updates.structure));
    }

    if (setClauses.length === 0) {
      throw new Error("no updates provided");
    }

    setClauses.push(`updated_at = $${paramIdx++}`);
    params.push(new Date());
    params.push(templateID);

    const result = await query(
      `UPDATE public.accounting_workflow_templates
       SET ${setClauses.join(", ")}
       WHERE id = $${paramIdx}
       RETURNING id, name, category, tax_regime, fiscal_period, regulatory_body,
                 structure_json, created_by, created_at, updated_at`,
      params
    );
    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      tax_regime: row.tax_regime || undefined,
      fiscal_period: row.fiscal_period || undefined,
      regulatory_body: row.regulatory_body || undefined,
      structure: typeof row.structure_json === "string" ? JSON.parse(row.structure_json) : row.structure_json,
      created_by: row.created_by || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getComplianceCalendar(
    organizationName: string,
    fiscalYear: number,
  ): Promise<ComplianceCalendar> {
    const organizationID = await this.getOrganizationIDByName(organizationName);

    const result = await query(
      `SELECT
        tw.name as template_name,
        tw.category,
        tw.fiscal_period,
        tw.structure_json->'deadlines' as deadlines,
        w.status
       FROM public.accounting_workflow_templates tw
       JOIN public.accounting_workflows w ON w.template_id = tw.id
       WHERE w.organization_id = $1
         AND w.fiscal_year = $2
         AND w.status != 'archived'
       ORDER BY w.created_at`,
      [organizationID, fiscalYear]
    );

    const obligations: ComplianceObligation[] = result.rows.map((row: any) => ({
      template_name: row.template_name,
      category: row.category,
      fiscal_period: row.fiscal_period,
      deadlines: typeof row.deadlines === "string" ? JSON.parse(row.deadlines) : (row.deadlines || {}),
      status: row.status,
    }));

    return {
      fiscal_year: fiscalYear,
      organization_id: organizationName,
      obligations,
    };
  }
}
