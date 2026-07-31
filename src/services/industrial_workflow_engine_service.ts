import { query } from "./db";

export const AllowedCategories = [
  "manufacturing", "production", "quality_control", "maintenance",
  "assembly", "packaging", "warehouse", "logistics",
  "supply_chain", "chemical", "pharmaceutical", "food_processing",
  "automotive", "aerospace", "electronics", "textile",
  "metalworking", "plastics", "printing", "renewable_energy",
] as const;

export const IndustrySectors = [
  "automotive", "aerospace", "electronics", "pharmaceutical",
  "food_beverage", "chemical", "oil_gas", "mining",
  "construction", "textile", "metal_processing", "renewable_energy",
] as const;

export interface WorkflowStage {
  name: string;
  probability: number;
  qualityCheck?: boolean;
  safetyCheckpoint?: boolean;
}

export interface WorkflowStructure {
  stages: WorkflowStage[];
  kpis: string[];
  qualityMetrics?: string[];
  safetyRequirements?: string[];
  automations?: string[];
  equipmentRequirements?: string[];
  audit?: Record<string, unknown>;
  traceability?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  customizations?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  industrySector?: string;
  structure: WorkflowStructure;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndustrialWorkflow {
  id: string;
  organizationID: string;
  name: string;
  templateID: string;
  structure: WorkflowStructure;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class IndustrialWorkflowEngineService {
  private validateWorkflowStructure(structure: WorkflowStructure): void {
    if (structure.stages.length < 2) {
      throw new Error("workflow must have at least 2 stages");
    }
    for (const stage of structure.stages) {
      if (!stage.name) throw new Error("stage must have a name");
      if (stage.probability < 0 || stage.probability > 100) {
        throw new Error("probability must be between 0 and 100");
      }
    }
    if (structure.kpis.length === 0) {
      throw new Error("workflow must define KPIs");
    }
  }

  private async getOrganizationIDByName(organizationName: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1 AND deleted_at IS NULL`,
      [organizationName]
    );
    if (!result.rows[0]) throw new Error(`organization '${organizationName}' not found`);
    return result.rows[0].id;
  }

  async createTemplate(
    name: string,
    category: string,
    structure: WorkflowStructure,
    createdBy?: string,
    industrySector?: string,
  ): Promise<WorkflowTemplate> {
    if (!name) throw new Error("template name is required");

    if (!(AllowedCategories as readonly string[]).includes(category)) {
      throw new Error(`invalid category: ${category}`);
    }

    if (industrySector && !(IndustrySectors as readonly string[]).includes(industrySector)) {
      throw new Error(`invalid industry sector: ${industrySector}`);
    }

    if (!structure.metadata) {
      structure.metadata = {};
    }
    if (industrySector) {
      structure.metadata.industry_sector = industrySector;
    }
    structure.metadata.created_by_service = "IndustrialWorkflowEngineService";

    if (!structure.qualityMetrics || structure.qualityMetrics.length === 0) {
      structure.qualityMetrics = ["defect_rate", "first_pass_yield"];
    }
    if (!structure.safetyRequirements || structure.safetyRequirements.length === 0) {
      structure.safetyRequirements = ["osha_compliance", "ppe_required"];
    }

    this.validateWorkflowStructure(structure);

    const structureJSON = JSON.stringify(structure);

    const result = await query(`
      INSERT INTO public.industrial_workflow_templates (
        name, category, industry_sector, structure_json, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, category, industry_sector, structure_json, created_by, created_at, updated_at
    `, [name, category, industrySector || null, structureJSON, createdBy || null]);

    const r = result.rows[0];

    return {
      id: r.id,
      name: r.name,
      category: r.category,
      industrySector: r.industry_sector || undefined,
      structure: typeof r.structure_json === "string" ? JSON.parse(r.structure_json) : r.structure_json,
      createdBy: r.created_by || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  generateIndustrialTemplates(count: number): WorkflowTemplate[] {
    const templates: WorkflowTemplate[] = [];

    const buildTemplate = (
      name: string,
      category: string,
      industrySector: string,
      stages: WorkflowStage[],
      kpis: string[],
      qualityMetrics: string[],
      safetyRequirements: string[],
      automations: string[],
      equipmentRequirements: string[],
    ): WorkflowTemplate => ({
      id: "",
      name,
      category,
      industrySector,
      structure: {
        stages,
        kpis,
        qualityMetrics,
        safetyRequirements,
        automations,
        equipmentRequirements,
        audit: { track_history: true, quality_audit_required: true },
        traceability: { batch_tracking: true, serial_number_tracking: false },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    templates.push(buildTemplate(
      "Assembly Line Production", "manufacturing", "automotive",
      [
        { name: "Raw Material Prep", probability: 100, qualityCheck: true },
        { name: "Component Assembly", probability: 90, qualityCheck: true },
        { name: "Quality Inspection", probability: 80, qualityCheck: true },
        { name: "Final Assembly", probability: 70, qualityCheck: true },
        { name: "Testing & Validation", probability: 60, qualityCheck: true },
        { name: "Packaging", probability: 100, qualityCheck: false },
      ],
      ["cycle_time", "throughput", "defect_rate", "overall_equipment_effectiveness"],
      ["first_pass_yield", "scrap_rate", "rework_rate"],
      ["osha_compliance", "ppe_required"],
      [],
      ["assembly_line", "conveyor_system", "testing_equipment"],
    ));

    templates.push(buildTemplate(
      "Quality Control Inspection", "quality_control", "electronics",
      [
        { name: "Sample Collection", probability: 100, safetyCheckpoint: true },
        { name: "Visual Inspection", probability: 95, qualityCheck: true },
        { name: "Dimensional Testing", probability: 90, qualityCheck: true },
        { name: "Material Testing", probability: 85, qualityCheck: true },
        { name: "Documentation", probability: 100, qualityCheck: false },
      ],
      ["inspection_rate", "non_conformance_rate", "accuracy", "turnaround_time"],
      ["measurement_uncertainty", "calibration_status"],
      ["osha_compliance", "ppe_required"],
      [],
      [],
    ));

    templates.push(buildTemplate(
      "Preventive Maintenance", "maintenance", "aerospace",
      [
        { name: "Inspection", probability: 100, safetyCheckpoint: true },
        { name: "Diagnostics", probability: 90, safetyCheckpoint: true },
        { name: "Repair/Adjustment", probability: 70, safetyCheckpoint: true },
        { name: "Testing", probability: 85, qualityCheck: true },
        { name: "Validation", probability: 95, qualityCheck: true },
      ],
      ["mtbf", "mttr", "availability", "maintenance_cost"],
      ["defect_rate", "first_pass_yield"],
      ["lockout_tagout", "confined_space_permit", "hot_work_permit"],
      [],
      [],
    ));

    templates.push(buildTemplate(
      "Batch Processing", "chemical", "pharmaceutical",
      [
        { name: "Raw Material Verification", probability: 100, qualityCheck: true },
        { name: "Mixing/Blending", probability: 95, qualityCheck: true },
        { name: "Reaction Control", probability: 90, safetyCheckpoint: true },
        { name: "Purification", probability: 85, qualityCheck: true },
        { name: "Quality Testing", probability: 80, qualityCheck: true },
        { name: "Packaging & Labeling", probability: 100, qualityCheck: false },
      ],
      ["batch_yield", "purity", "process_capability", "waste_reduction"],
      ["defect_rate", "first_pass_yield"],
      ["hazmat_handling", "ventilation_requirements", "ppe_level_c"],
      [],
      [],
    ));

    templates.push(buildTemplate(
      "Warehouse Operations", "warehouse", "food_beverage",
      [
        { name: "Receiving", probability: 100, qualityCheck: true },
        { name: "Quality Hold", probability: 95, qualityCheck: true },
        { name: "Putaway", probability: 100 },
        { name: "Inventory Count", probability: 98 },
        { name: "Picking", probability: 100 },
        { name: "Packing", probability: 100, qualityCheck: true },
        { name: "Shipping", probability: 100 },
      ],
      ["inventory_accuracy", "order_fulfillment_rate", "dock_to_stock_time", "pick_rate"],
      ["defect_rate", "first_pass_yield"],
      ["osha_compliance", "ppe_required"],
      [],
      [],
    ));

    templates.push(buildTemplate(
      "Electronics Manufacturing", "electronics", "electronics",
      [
        { name: "SMT Assembly", probability: 95, qualityCheck: true },
        { name: "AOI Inspection", probability: 90, qualityCheck: true },
        { name: "Through-hole Assembly", probability: 95, qualityCheck: true },
        { name: "Functional Testing", probability: 85, qualityCheck: true },
        { name: "Burn-in Testing", probability: 80, qualityCheck: true },
        { name: "Final QC", probability: 75, qualityCheck: true },
      ],
      ["defects_per_million", "first_pass_yield", "test_coverage", "cycle_time"],
      ["defect_rate", "first_pass_yield"],
      ["osha_compliance", "ppe_required"],
      [],
      ["pick_and_place", "reflow_oven", "aoi_machine", "ict_tester"],
    ));

    return templates.slice(0, count);
  }

  async createWorkflowFromTemplate(
    templateID: string,
    organizationName: string,
    name?: string,
    customization?: Record<string, unknown>,
  ): Promise<IndustrialWorkflow> {
    const tmplResult = await query(
      `SELECT structure_json, name, industry_sector FROM public.industrial_workflow_templates WHERE id = $1`,
      [templateID]
    );
    if (!tmplResult.rows[0]) throw new Error(`industrial workflow template not found: ${templateID}`);

    const tmplRow = tmplResult.rows[0];
    const structure: WorkflowStructure = typeof tmplRow.structure_json === "string"
      ? JSON.parse(tmplRow.structure_json)
      : tmplRow.structure_json;

    if (customization) {
      if (Array.isArray(customization.stages)) {
        structure.stages = customization.stages as WorkflowStage[];
      }
      if (Array.isArray(customization.kpis)) {
        structure.kpis = customization.kpis as string[];
      }
      if (Array.isArray(customization.quality_metrics)) {
        structure.qualityMetrics = customization.quality_metrics as string[];
      }
      structure.customizations = customization;
    }

    const organizationID = await this.getOrganizationIDByName(organizationName);
    const workflowName = name || tmplRow.name;
    const finalStructureJSON = JSON.stringify(structure);

    const result = await query(`
      INSERT INTO public.industrial_workflows (
        organization_id, name, template_id, structure_json, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, organization_id, name, template_id, structure_json, status, created_at, updated_at
    `, [organizationID, workflowName, templateID, finalStructureJSON, "active"]);

    const r = result.rows[0];

    return {
      id: r.id,
      organizationID: r.organization_id,
      name: r.name,
      templateID: r.template_id,
      structure: typeof r.structure_json === "string" ? JSON.parse(r.structure_json) : r.structure_json,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async getTemplatesByCategory(category: string): Promise<WorkflowTemplate[]> {
    if (!(AllowedCategories as readonly string[]).includes(category)) {
      throw new Error(`invalid category: ${category}`);
    }

    const result = await query(`
      SELECT id, name, category, industry_sector, structure_json, created_by, created_at, updated_at
      FROM public.industrial_workflow_templates
      WHERE category = $1
      ORDER BY created_at DESC
    `, [category]);

    return result.rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      category: r.category as string,
      industrySector: (r.industry_sector as string) || undefined,
      structure: typeof r.structure_json === "string" ? JSON.parse(r.structure_json as string) : r.structure_json,
      createdBy: (r.created_by as string) || undefined,
      createdAt: r.created_at as Date,
      updatedAt: r.updated_at as Date,
    }));
  }

  async getTemplatesByIndustry(industrySector: string): Promise<WorkflowTemplate[]> {
    if (!(IndustrySectors as readonly string[]).includes(industrySector)) {
      throw new Error(`invalid industry sector: ${industrySector}`);
    }

    const result = await query(`
      SELECT id, name, category, industry_sector, structure_json, created_by, created_at, updated_at
      FROM public.industrial_workflow_templates
      WHERE industry_sector = $1
      ORDER BY created_at DESC
    `, [industrySector]);

    return result.rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      category: r.category as string,
      industrySector: (r.industry_sector as string) || undefined,
      structure: typeof r.structure_json === "string" ? JSON.parse(r.structure_json as string) : r.structure_json,
      createdBy: (r.created_by as string) || undefined,
      createdAt: r.created_at as Date,
      updatedAt: r.updated_at as Date,
    }));
  }

  async updateTemplate(
    templateID: string,
    name?: string,
    category?: string,
    structure?: WorkflowStructure,
  ): Promise<WorkflowTemplate> {
    const checkResult = await query(
      `SELECT id FROM public.industrial_workflow_templates WHERE id = $1`,
      [templateID]
    );
    if (!checkResult.rows[0]) throw new Error(`template not found: ${templateID}`);

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }

    if (category) {
      if (!(AllowedCategories as readonly string[]).includes(category)) {
        throw new Error(`invalid category: ${category}`);
      }
      updates.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (structure) {
      this.validateWorkflowStructure(structure);
      updates.push(`structure_json = $${paramIndex++}`);
      params.push(JSON.stringify(structure));
    }

    if (updates.length === 0) throw new Error("no updates provided");

    updates.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());
    params.push(templateID);

    const result = await query(`
      UPDATE public.industrial_workflow_templates
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, category, industry_sector, structure_json, created_by, created_at, updated_at
    `, params);

    const r = result.rows[0];

    return {
      id: r.id,
      name: r.name,
      category: r.category,
      industrySector: (r.industry_sector as string) || undefined,
      structure: typeof r.structure_json === "string" ? JSON.parse(r.structure_json) : r.structure_json,
      createdBy: (r.created_by as string) || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
