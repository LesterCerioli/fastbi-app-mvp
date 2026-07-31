import { query, queryTx } from "../../db";

export type SectionType =
  | "narrative"
  | "kpi_summary"
  | "chart"
  | "table"
  | "executive_summary"
  | "custom_html";

export interface SectionDTO {
  organizationID: string;
  templateName: string;
  type: SectionType;
  orderIndex: number;
  config: Record<string, any>;
  isOptional: boolean;
  visibilityRule: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetDTO {
  sectionOrderIndex: number;
  widgetType: string;
  dataBinding: Record<string, any>;
  styleConfig: Record<string, any>;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionRequest {
  organizationName: string;
  templateName: string;
  type: SectionType;
  orderIndex: number;
  config: Record<string, any>;
  isOptional: boolean;
  visibilityRule?: Record<string, any>;
}

export interface UpdateSectionRequest {
  organizationName: string;
  config?: Record<string, any>;
  isOptional?: boolean;
  visibilityRule?: Record<string, any>;
}

export interface ReorderSectionsRequest {
  organizationName: string;
  newOrder: number[];
}

export interface CreateWidgetRequest {
  organizationName: string;
  templateName: string;
  widgetType: string;
  dataBinding: Record<string, any>;
  styleConfig: Record<string, any>;
  orderIndex: number;
}

export interface UpdateWidgetRequest {
  organizationName: string;
  dataBinding?: Record<string, any>;
  styleConfig?: Record<string, any>;
}

export interface ReorderWidgetsRequest {
  organizationName: string;
  newOrder: number[];
}

export interface NarrativeFragmentDTO {
  sectionID: string;
  title: string;
  queryHint: string;
  sectionType: string;
  orderIndex: number;
  citationRequired: boolean;
}

export class TemplateSectionService {
  async resolveOrganizationID(name: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [name]
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${name}`);
    }
    return result.rows[0].id;
  }

  async resolveTemplateID(orgID: string, templateName: string): Promise<string> {
    const result = await query(
      `SELECT id FROM public.report_templates WHERE name = $1 AND organization_id = $2 AND is_active = TRUE`,
      [templateName, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error(`report template not found: ${templateName}`);
    }
    return result.rows[0].id;
  }

  async resolveTemplateName(templateID: string): Promise<string> {
    const result = await query(
      `SELECT name FROM public.report_templates WHERE id = $1`,
      [templateID]
    );
    return result.rows[0]?.name;
  }

  async resolveSectionID(templateID: string, orderIndex: number): Promise<string> {
    const result = await query(
      `SELECT id FROM public.report_template_sections WHERE template_id = $1 AND order_index = $2`,
      [templateID, orderIndex]
    );
    if (result.rows.length === 0) {
      throw new Error(`section not found at order_index ${orderIndex}`);
    }
    return result.rows[0].id;
  }

  async createSection(req: CreateSectionRequest): Promise<SectionDTO> {
    if (!req.organizationName) throw new Error("organization_name is required");
    if (!req.templateName) throw new Error("template_name is required");
    validateSectionConfig(req.type, req.config);

    const orgID = await this.resolveOrganizationID(req.organizationName);
    const templateID = await this.resolveTemplateID(orgID, req.templateName);

    const configJSON = JSON.stringify(req.config);
    const visJSON = req.visibilityRule ? JSON.stringify(req.visibilityRule) : null;

    const result = await query(
      `INSERT INTO public.report_template_sections
         (organization_id, template_id, type, order_index, config, is_optional, visibility_rule)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING created_at, updated_at`,
      [orgID, templateID, req.type, req.orderIndex, configJSON, req.isOptional, visJSON]
    );

    const { created_at, updated_at } = result.rows[0];

    return {
      organizationID: orgID,
      templateName: req.templateName,
      type: req.type,
      orderIndex: req.orderIndex,
      config: req.config,
      isOptional: req.isOptional,
      visibilityRule: req.visibilityRule || {},
      createdAt: created_at,
      updatedAt: updated_at,
    };
  }

  async listSections(organizationName: string, templateName: string): Promise<SectionDTO[]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    const result = await query(
      `SELECT type, order_index, config, is_optional, visibility_rule, created_at, updated_at
       FROM public.report_template_sections
       WHERE template_id = $1
       ORDER BY order_index ASC`,
      [templateID]
    );

    return result.rows.map((r: any) => ({
      organizationID: orgID,
      templateName,
      type: r.type as SectionType,
      orderIndex: r.order_index,
      config: typeof r.config === "string" ? JSON.parse(r.config) : r.config || {},
      isOptional: r.is_optional,
      visibilityRule: typeof r.visibility_rule === "string" ? JSON.parse(r.visibility_rule) : r.visibility_rule || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getSection(
    organizationName: string,
    templateName: string,
    orderIndex: number
  ): Promise<SectionDTO> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    const result = await query(
      `SELECT type, config, is_optional, visibility_rule, created_at, updated_at
       FROM public.report_template_sections
       WHERE template_id = $1 AND order_index = $2`,
      [templateID, orderIndex]
    );
    if (result.rows.length === 0) {
      throw new Error(`section not found at order_index ${orderIndex}`);
    }

    const r = result.rows[0];
    return {
      organizationID: orgID,
      templateName,
      type: r.type as SectionType,
      orderIndex,
      config: typeof r.config === "string" ? JSON.parse(r.config) : r.config || {},
      isOptional: r.is_optional,
      visibilityRule: typeof r.visibility_rule === "string" ? JSON.parse(r.visibility_rule) : r.visibility_rule || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async updateSection(
    organizationName: string,
    templateName: string,
    orderIndex: number,
    req: UpdateSectionRequest
  ): Promise<SectionDTO> {
    const existing = await this.getSection(organizationName, templateName, orderIndex);

    if (req.config) {
      validateSectionConfig(existing.type, req.config);
      existing.config = req.config;
    }
    if (req.isOptional !== undefined) existing.isOptional = req.isOptional;
    if (req.visibilityRule !== undefined) existing.visibilityRule = req.visibilityRule;

    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    const configJSON = JSON.stringify(existing.config);
    const visJSON = JSON.stringify(existing.visibilityRule);

    const result = await query(
      `UPDATE public.report_template_sections
       SET config = $1, is_optional = $2, visibility_rule = $3, updated_at = NOW()
       WHERE template_id = $4 AND order_index = $5
       RETURNING updated_at`,
      [configJSON, existing.isOptional, visJSON, templateID, orderIndex]
    );

    existing.updatedAt = result.rows[0].updated_at;
    return existing;
  }

  async deleteSection(
    organizationName: string,
    templateName: string,
    orderIndex: number
  ): Promise<void> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    const result = await query(
      `DELETE FROM public.report_template_sections
       WHERE template_id = $1 AND order_index = $2`,
      [templateID, orderIndex]
    );
    if (result.rowCount === 0) {
      throw new Error(`section not found at order_index ${orderIndex}`);
    }
  }

  async reorderSections(
    templateName: string,
    req: ReorderSectionsRequest
  ): Promise<void> {
    if (!req.organizationName) throw new Error("organization_name is required");
    const orgID = await this.resolveOrganizationID(req.organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    await queryTx(async (q) => {
      await q(
        `UPDATE public.report_template_sections
         SET order_index = -(order_index + 1)
         WHERE template_id = $1`,
        [templateID]
      );

      for (let newIdx = 0; newIdx < req.newOrder.length; newIdx++) {
        const currentIdx = req.newOrder[newIdx];
        const staged = -(currentIdx + 1);
        await q(
          `UPDATE public.report_template_sections
           SET order_index = $1, updated_at = NOW()
           WHERE template_id = $2 AND order_index = $3`,
          [newIdx, templateID, staged]
        );
      }
    });
  }

  async createWidget(
    sectionOrderIndex: number,
    req: CreateWidgetRequest
  ): Promise<WidgetDTO> {
    if (!req.organizationName) throw new Error("organization_name is required");
    if (!req.templateName) throw new Error("template_name is required");
    if (!req.widgetType) throw new Error("widget_type is required");

    const orgID = await this.resolveOrganizationID(req.organizationName);
    const templateID = await this.resolveTemplateID(orgID, req.templateName);
    const sectionID = await this.resolveSectionID(templateID, sectionOrderIndex);

    await this.validateDataBindingKPIs(orgID, req.dataBinding);

    const bindJSON = JSON.stringify(req.dataBinding);
    const styleJSON = JSON.stringify(req.styleConfig);

    const result = await query(
      `INSERT INTO public.report_template_widgets
         (organization_id, section_id, widget_type, data_binding, style_config, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING created_at, updated_at`,
      [orgID, sectionID, req.widgetType, bindJSON, styleJSON, req.orderIndex]
    );

    return {
      sectionOrderIndex,
      widgetType: req.widgetType,
      dataBinding: req.dataBinding,
      styleConfig: req.styleConfig,
      orderIndex: req.orderIndex,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  }

  async listWidgets(
    organizationName: string,
    templateName: string,
    sectionOrderIndex: number
  ): Promise<WidgetDTO[]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);
    const sectionID = await this.resolveSectionID(templateID, sectionOrderIndex);

    const result = await query(
      `SELECT widget_type, data_binding, style_config, order_index, created_at, updated_at
       FROM public.report_template_widgets
       WHERE section_id = $1 AND organization_id = $2
       ORDER BY order_index ASC`,
      [sectionID, orgID]
    );

    return result.rows.map((r: any) => ({
      sectionOrderIndex,
      widgetType: r.widget_type,
      dataBinding: typeof r.data_binding === "string" ? JSON.parse(r.data_binding) : r.data_binding || {},
      styleConfig: typeof r.style_config === "string" ? JSON.parse(r.style_config) : r.style_config || {},
      orderIndex: r.order_index,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async updateWidget(
    organizationName: string,
    templateName: string,
    sectionOrderIndex: number,
    widgetOrderIndex: number,
    req: UpdateWidgetRequest
  ): Promise<WidgetDTO> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);
    const sectionID = await this.resolveSectionID(templateID, sectionOrderIndex);

    const existing = await query(
      `SELECT widget_type, data_binding, style_config, created_at
       FROM public.report_template_widgets
       WHERE section_id = $1 AND order_index = $2 AND organization_id = $3`,
      [sectionID, widgetOrderIndex, orgID]
    );
    if (existing.rows.length === 0) {
      throw new Error(`widget not found at order_index ${widgetOrderIndex}`);
    }

    let bind = typeof existing.rows[0].data_binding === "string"
      ? JSON.parse(existing.rows[0].data_binding)
      : existing.rows[0].data_binding || {};
    let style = typeof existing.rows[0].style_config === "string"
      ? JSON.parse(existing.rows[0].style_config)
      : existing.rows[0].style_config || {};

    if (req.dataBinding) {
      await this.validateDataBindingKPIs(orgID, req.dataBinding);
      bind = req.dataBinding;
    }
    if (req.styleConfig) style = req.styleConfig;

    const newBind = JSON.stringify(bind);
    const newStyle = JSON.stringify(style);

    const result = await query(
      `UPDATE public.report_template_widgets
       SET data_binding = $1, style_config = $2, updated_at = NOW()
       WHERE section_id = $3 AND order_index = $4 AND organization_id = $5
       RETURNING updated_at`,
      [newBind, newStyle, sectionID, widgetOrderIndex, orgID]
    );

    return {
      sectionOrderIndex,
      widgetType: existing.rows[0].widget_type,
      dataBinding: bind,
      styleConfig: style,
      orderIndex: widgetOrderIndex,
      createdAt: existing.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  }

  async deleteWidget(
    organizationName: string,
    templateName: string,
    sectionOrderIndex: number,
    widgetOrderIndex: number
  ): Promise<void> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);
    const sectionID = await this.resolveSectionID(templateID, sectionOrderIndex);

    const result = await query(
      `DELETE FROM public.report_template_widgets
       WHERE section_id = $1 AND order_index = $2 AND organization_id = $3`,
      [sectionID, widgetOrderIndex, orgID]
    );
    if (result.rowCount === 0) {
      throw new Error(`widget not found at order_index ${widgetOrderIndex}`);
    }
  }

  async reorderWidgets(
    templateName: string,
    sectionOrderIndex: number,
    req: ReorderWidgetsRequest
  ): Promise<void> {
    if (!req.organizationName) throw new Error("organization_name is required");
    const orgID = await this.resolveOrganizationID(req.organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);
    const sectionID = await this.resolveSectionID(templateID, sectionOrderIndex);

    await queryTx(async (q) => {
      await q(
        `UPDATE public.report_template_widgets
         SET order_index = -(order_index + 1)
         WHERE section_id = $1 AND organization_id = $2`,
        [sectionID, orgID]
      );

      for (let newIdx = 0; newIdx < req.newOrder.length; newIdx++) {
        const currentIdx = req.newOrder[newIdx];
        const staged = -(currentIdx + 1);
        await q(
          `UPDATE public.report_template_widgets
           SET order_index = $1, updated_at = NOW()
           WHERE section_id = $2 AND order_index = $3 AND organization_id = $4`,
          [newIdx, sectionID, staged, orgID]
        );
      }
    });
  }

  async getNarrativeFragments(
    organizationName: string,
    templateName: string
  ): Promise<NarrativeFragmentDTO[]> {
    const orgID = await this.resolveOrganizationID(organizationName);
    const templateID = await this.resolveTemplateID(orgID, templateName);

    const result = await query(
      `SELECT order_index, config
       FROM public.report_template_sections
       WHERE template_id = $1 AND type = 'narrative'
       ORDER BY order_index ASC`,
      [templateID]
    );

    return result.rows.map((r: any) => {
      const cfg = typeof r.config === "string" ? JSON.parse(r.config) : r.config || {};
      return buildNarrativeFragment(r.order_index, cfg);
    });
  }

  private async validateDataBindingKPIs(
    orgID: string,
    binding: Record<string, any>
  ): Promise<void> {
    const codes = collectKPICodes(binding);
    if (codes.length === 0) return;

    for (const code of codes) {
      const result = await query(
        `SELECT EXISTS (
           SELECT 1 FROM public.kpis
           WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL
         ) AS exists`,
        [code, orgID]
      );
      if (!result.rows[0].exists) {
        throw new Error(`kpi_code '${code}' not found in organization's KPI registry`);
      }
    }
  }
}

function validateSectionConfig(sType: SectionType, config: Record<string, any>): void {
  switch (sType) {
    case "narrative":
      if (!("prompt_fragment" in config)) throw new Error("narrative section config must include prompt_fragment");
      break;
    case "kpi_summary":
      if (!("kpi_ids" in config)) throw new Error("kpi_summary section config must include kpi_ids");
      break;
    case "chart":
      if (!("chart_type" in config)) throw new Error("chart section config must include chart_type");
      if (!("metric_query" in config)) throw new Error("chart section config must include metric_query");
      break;
    case "table":
      if (!("columns" in config)) throw new Error("table section config must include columns");
      break;
    case "executive_summary":
      if (!("top_n" in config)) throw new Error("executive_summary section config must include top_n");
      break;
    case "custom_html":
      if (!("html" in config)) throw new Error("custom_html section config must include html");
      break;
    default:
      throw new Error(`unknown section type: ${sType}`);
  }
}

function collectKPICodes(binding: Record<string, any>): string[] {
  if (!binding || Object.keys(binding).length === 0) return [];
  const codes: string[] = [];
  if (typeof binding["kpi_code"] === "string" && binding["kpi_code"]) {
    codes.push(binding["kpi_code"]);
  }
  if (Array.isArray(binding["kpi_codes"])) {
    for (const item of binding["kpi_codes"]) {
      if (typeof item === "string" && item) codes.push(item);
    }
  }
  return codes;
}

function buildNarrativeFragment(
  orderIdx: number,
  cfg: Record<string, any>
): NarrativeFragmentDTO {
  const promptFragment = typeof cfg["prompt_fragment"] === "string" ? cfg["prompt_fragment"] : "";
  let title = typeof cfg["title"] === "string" ? cfg["title"] : "";
  if (!title) title = `Narrative Section ${orderIdx}`;
  const citationRequired = cfg["citation_required"] === true;

  return {
    sectionID: `section-${orderIdx}`,
    title,
    queryHint: promptFragment,
    sectionType: "narrative",
    orderIndex: orderIdx,
    citationRequired,
  };
}
