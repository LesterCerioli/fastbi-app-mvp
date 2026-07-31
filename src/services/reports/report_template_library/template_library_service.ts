import { query, queryTx } from "../../db";

const maxSnapshotSections = 100;
const maxSnapshotWidgets = 200;

export type TemplateScope = "platform" | "organization";

export interface TemplateDTO {
  id: string;
  organizationID: string;
  name: string;
  description: string;
  category: string;
  industryTag: string;
  previewURL: string;
  exportFormat: string;
  language: string;
  scope: TemplateScope;
  currentVersion: number;
  usageCount: number;
  sourceTemplateID: string | null;
  sourceVersion: number | null;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVersionDTO {
  id: string;
  organizationID: string;
  templateID: string;
  version: number;
  sectionsSnapshot: Record<string, any>;
  changedBy: string;
  changeSummary: string;
  createdAt: Date;
}

interface SnapshotSection {
  type: string;
  orderIndex: number;
  config: Record<string, any>;
  isOptional: boolean;
  visibilityRule: Record<string, any>;
  widgets: SnapshotWidget[];
}

interface SnapshotWidget {
  widgetType: string;
  orderIndex: number;
  dataBinding: Record<string, any>;
  styleConfig: Record<string, any>;
}

export interface CreateTemplateRequest {
  organizationName: string;
  name: string;
  description: string;
  category: string;
  industryTag: string;
  previewURL: string;
  exportFormat: string;
  language: string;
  scope: TemplateScope;
  createdBy: string;
}

export interface UpdateTemplateRequest {
  organizationName: string;
  description: string;
  category: string;
  industryTag: string;
  previewURL: string;
  changedBy: string;
  changeSummary: string;
}

export interface RollbackRequest {
  organizationName: string;
  changedBy: string;
}

export interface CloneRequest {
  organizationName: string;
  newName: string;
  description: string;
  scope: TemplateScope;
  createdBy: string;
}

const templateJoinSelect = `
  SELECT rt.id, rt.organization_id, rt.name,
         COALESCE(rt.description,''), COALESCE(rt.category,''),
         COALESCE(rtc.industry_tag,''), COALESCE(rtc.preview_url,''),
         COALESCE(rt.export_format,'pdf'), COALESCE(rt.language,'en'),
         COALESCE(rtc.scope,'organization'), COALESCE(rtc.current_version,1),
         COALESCE(rtc.usage_count,0),
         rtc.source_template_id, rtc.source_version,
         rt.is_active, COALESCE(rt.created_by,''), COALESCE(rt.updated_by,''),
         rt.created_at, rt.updated_at
  FROM public.report_templates rt
  JOIN public.report_template_catalog rtc ON rtc.template_id = rt.id`;

export class TemplateLibraryService {
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

  async listTemplates(orgName: string, scope: string): Promise<TemplateDTO[]> {
    if (!orgName) throw new Error("organization_name is required");
    const orgID = await this.resolveOrganizationID(orgName);

    let queryStr: string;
    const args: unknown[] = [];

    switch (scope) {
      case "platform":
        queryStr = templateJoinSelect + `
          WHERE rtc.scope = 'platform' AND rt.is_active = TRUE
          ORDER BY rt.name ASC`;
        break;
      case "organization":
        queryStr = templateJoinSelect + `
          WHERE rtc.organization_id = $1 AND rtc.scope = 'organization' AND rt.is_active = TRUE
          ORDER BY rt.name ASC`;
        args.push(orgID);
        break;
      default:
        queryStr = templateJoinSelect + `
          WHERE (rtc.scope = 'platform' OR rtc.organization_id = $1) AND rt.is_active = TRUE
          ORDER BY rtc.scope ASC, rt.name ASC`;
        args.push(orgID);
        break;
    }

    const result = await query(queryStr, args);
    return result.rows.map((r: any) => this.mapTemplateRow(r));
  }

  async getTemplate(orgName: string, templateName: string): Promise<TemplateDTO> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template name is required");
    const orgID = await this.resolveOrganizationID(orgName);
    return this.fetchTemplateByName(orgID, templateName);
  }

  async createTemplate(req: CreateTemplateRequest): Promise<TemplateDTO> {
    if (!req.organizationName) throw new Error("organization_name is required");
    if (!req.name) throw new Error("name is required");
    if (req.scope !== "platform" && req.scope !== "organization") req.scope = "organization";
    if (!req.exportFormat) req.exportFormat = "pdf";
    if (!req.language) req.language = "en";

    const orgID = await this.resolveOrganizationID(req.organizationName);

    return queryTx(async (q) => {
      const insertResult = await q(
        `INSERT INTO public.report_templates
           (organization_id, name, description, category, export_format, language, created_by, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '{}')
         RETURNING id`,
        [orgID, req.name, req.description, req.category, req.exportFormat, req.language, req.createdBy]
      );
      const templateID = insertResult.rows[0].id;

      await q(
        `INSERT INTO public.report_template_catalog
           (organization_id, template_id, scope, industry_tag, preview_url, current_version, usage_count)
         VALUES ($1, $2, $3, $4, $5, 1, 0)`,
        [orgID, templateID, req.scope, req.industryTag, req.previewURL]
      );

      return this.fetchTemplateByID(templateID);
    });
  }

  async updateTemplate(
    orgName: string,
    templateName: string,
    req: UpdateTemplateRequest
  ): Promise<TemplateDTO> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template name is required");

    const orgID = await this.resolveOrganizationID(orgName);
    const current = await this.fetchTemplateByName(orgID, templateName);
    const snapshot = await this.snapshotSections(current.id);

    if (!req.description) req.description = current.description;
    if (!req.category) req.category = current.category;
    if (!req.industryTag) req.industryTag = current.industryTag;
    if (!req.previewURL) req.previewURL = current.previewURL;
    const newVersion = current.currentVersion + 1;

    return queryTx(async (q) => {
      const snapshotB = JSON.stringify(snapshot);
      await q(
        `INSERT INTO public.report_template_versions
           (organization_id, template_id, version, sections_snapshot, changed_by, change_summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgID, current.id, current.currentVersion, snapshotB, req.changedBy, req.changeSummary]
      );

      await q(
        `UPDATE public.report_templates
         SET description = $1, category = $2, updated_by = $3, updated_at = NOW()
         WHERE id = $4`,
        [req.description, req.category, req.changedBy, current.id]
      );

      await q(
        `UPDATE public.report_template_catalog
         SET industry_tag = $1, preview_url = $2, current_version = $3, updated_at = NOW()
         WHERE template_id = $4 AND organization_id = $5`,
        [req.industryTag, req.previewURL, newVersion, current.id, orgID]
      );

      return this.fetchTemplateByID(current.id);
    });
  }

  async rollbackTemplate(
    orgName: string,
    templateName: string,
    targetVersion: number,
    req: RollbackRequest
  ): Promise<TemplateDTO> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template name is required");
    if (targetVersion < 1) throw new Error("version must be >= 1");

    const orgID = await this.resolveOrganizationID(orgName);
    const current = await this.fetchTemplateByName(orgID, templateName);
    if (targetVersion >= current.currentVersion) {
      throw new Error(`target version ${targetVersion} does not exist; current version is ${current.currentVersion}`);
    }

    const versionResult = await query(
      `SELECT sections_snapshot
       FROM public.report_template_versions
       WHERE template_id = $1 AND version = $2 AND organization_id = $3`,
      [current.id, targetVersion, orgID]
    );
    if (versionResult.rows.length === 0) {
      throw new Error(`version ${targetVersion} not found for template ${templateName}`);
    }

    const targetSnapshot = versionResult.rows[0].sections_snapshot;
    const currentSnapshot = await this.snapshotSections(current.id);

    const changedBy = req.changedBy || "system";
    const changeSummary = `rollback to version ${targetVersion}`;
    const newVersion = current.currentVersion + 1;

    return queryTx(async (q) => {
      const snapshotB = JSON.stringify(currentSnapshot);
      await q(
        `INSERT INTO public.report_template_versions
           (organization_id, template_id, version, sections_snapshot, changed_by, change_summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orgID, current.id, current.currentVersion, snapshotB, changedBy, changeSummary]
      );

      const targetSnapshotParsed = typeof targetSnapshot === "string" ? JSON.parse(targetSnapshot) : targetSnapshot;
      await this.restoreSnapshot(q, current.id, orgID, targetSnapshotParsed);

      await q(
        `UPDATE public.report_template_catalog
         SET current_version = $1, updated_at = NOW()
         WHERE template_id = $2 AND organization_id = $3`,
        [newVersion, current.id, orgID]
      );

      return this.fetchTemplateByID(current.id);
    });
  }

  async cloneTemplate(
    orgName: string,
    templateName: string,
    req: CloneRequest
  ): Promise<TemplateDTO> {
    if (!orgName) throw new Error("organization_name is required");
    if (!templateName) throw new Error("template name is required");
    if (!req.newName) throw new Error("new_name is required");
    if (!req.organizationName) req.organizationName = orgName;
    if (req.scope !== "platform" && req.scope !== "organization") req.scope = "organization";

    const srcOrgID = await this.resolveOrganizationID(orgName);
    const source = await this.fetchTemplateByName(srcOrgID, templateName);
    const dstOrgID = await this.resolveOrganizationID(req.organizationName);
    const snapshot = await this.snapshotSections(source.id);

    if (!req.description) req.description = source.description;

    return queryTx(async (q) => {
      const insertResult = await q(
        `INSERT INTO public.report_templates
           (organization_id, name, description, category, export_format, language, created_by, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '{}')
         RETURNING id`,
        [dstOrgID, req.newName, req.description, source.category, source.exportFormat, source.language, req.createdBy]
      );
      const newID = insertResult.rows[0].id;

      await q(
        `INSERT INTO public.report_template_catalog
           (organization_id, template_id, scope, industry_tag, preview_url,
            current_version, usage_count, source_template_id, source_version)
         VALUES ($1, $2, $3, $4, $5, 1, 0, $6, $7)`,
        [dstOrgID, newID, req.scope, source.industryTag, source.previewURL, source.id, source.currentVersion]
      );

      await this.restoreSnapshot(q, newID, dstOrgID, snapshot);

      return this.fetchTemplateByID(newID);
    });
  }

  async listVersions(orgName: string, templateName: string): Promise<TemplateVersionDTO[]> {
    if (!orgName) throw new Error("organization_name is required");
    const orgID = await this.resolveOrganizationID(orgName);
    const tmpl = await this.fetchTemplateByName(orgID, templateName);

    const result = await query(
      `SELECT id, organization_id, template_id, version, sections_snapshot,
              COALESCE(changed_by,'') AS changed_by, COALESCE(change_summary,'') AS change_summary, created_at
       FROM public.report_template_versions
       WHERE template_id = $1 AND organization_id = $2
       ORDER BY version ASC
       LIMIT 500`,
      [tmpl.id, orgID]
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      organizationID: r.organization_id,
      templateID: r.template_id,
      version: r.version,
      sectionsSnapshot: typeof r.sections_snapshot === "string" ? JSON.parse(r.sections_snapshot) : r.sections_snapshot || {},
      changedBy: r.changed_by,
      changeSummary: r.change_summary,
      createdAt: r.created_at,
    }));
  }

  async getVersion(orgName: string, templateName: string, version: number): Promise<TemplateVersionDTO> {
    if (!orgName) throw new Error("organization_name is required");
    const orgID = await this.resolveOrganizationID(orgName);
    const tmpl = await this.fetchTemplateByName(orgID, templateName);

    const result = await query(
      `SELECT id, organization_id, template_id, version, sections_snapshot,
              COALESCE(changed_by,'') AS changed_by, COALESCE(change_summary,'') AS change_summary, created_at
       FROM public.report_template_versions
       WHERE template_id = $1 AND version = $2 AND organization_id = $3`,
      [tmpl.id, version, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error(`version ${version} not found for template ${templateName}`);
    }
    const r = result.rows[0];
    return {
      id: r.id,
      organizationID: r.organization_id,
      templateID: r.template_id,
      version: r.version,
      sectionsSnapshot: typeof r.sections_snapshot === "string" ? JSON.parse(r.sections_snapshot) : r.sections_snapshot || {},
      changedBy: r.changed_by,
      changeSummary: r.change_summary,
      createdAt: r.created_at,
    };
  }

  async incrementUsageCount(templateID: string): Promise<void> {
    await query(
      `UPDATE public.report_template_catalog
       SET usage_count = usage_count + 1
       WHERE template_id = $1`,
      [templateID]
    );
  }

  private async fetchTemplateByName(orgID: string, name: string): Promise<TemplateDTO> {
    const result = await query(
      templateJoinSelect + `
      WHERE rt.name = $1
        AND (rtc.organization_id = $2 OR rtc.scope = 'platform')
        AND rt.is_active = TRUE
      ORDER BY CASE WHEN rtc.organization_id = $2 THEN 0 ELSE 1 END
      LIMIT 1`,
      [name, orgID]
    );
    if (result.rows.length === 0) {
      throw new Error(`report template not found: ${name}`);
    }
    return this.mapTemplateRow(result.rows[0]);
  }

  private async fetchTemplateByID(id: string): Promise<TemplateDTO> {
    const result = await query(templateJoinSelect + ` WHERE rt.id = $1`, [id]);
    if (result.rows.length === 0) {
      throw new Error(`report template not found: ${id}`);
    }
    return this.mapTemplateRow(result.rows[0]);
  }

  private async snapshotSections(templateID: string): Promise<Record<string, any>> {
    const sectionsResult = await query(
      `SELECT id, type, order_index, config, is_optional, COALESCE(visibility_rule, '{}') AS visibility_rule
       FROM public.report_template_sections
       WHERE template_id = $1
       ORDER BY order_index ASC`,
      [templateID]
    );

    const sections: SnapshotSection[] = [];

    for (const row of sectionsResult.rows) {
      const sec: SnapshotSection = {
        type: row.type,
        orderIndex: row.order_index,
        config: typeof row.config === "string" ? JSON.parse(row.config) : row.config || {},
        isOptional: row.is_optional,
        visibilityRule: typeof row.visibility_rule === "string" ? JSON.parse(row.visibility_rule) : row.visibility_rule || {},
        widgets: [],
      };

      const widgetsResult = await query(
        `SELECT widget_type, order_index, data_binding, style_config
         FROM public.report_template_widgets
         WHERE section_id = $1
         ORDER BY order_index ASC`,
        [row.id]
      );

      for (const w of widgetsResult.rows) {
        sec.widgets.push({
          widgetType: w.widget_type,
          orderIndex: w.order_index,
          dataBinding: typeof w.data_binding === "string" ? JSON.parse(w.data_binding) : w.data_binding || {},
          styleConfig: typeof w.style_config === "string" ? JSON.parse(w.style_config) : w.style_config || {},
        });
      }

      sections.push(sec);
    }

    return { sections };
  }

  private async restoreSnapshot(
    q: (text: string, params?: unknown[]) => Promise<any>,
    templateID: string,
    orgID: string,
    snapshot: Record<string, any>
  ): Promise<void> {
    await q(
      `DELETE FROM public.report_template_sections WHERE template_id = $1`,
      [templateID]
    );

    const sectionsRaw = snapshot["sections"] as SnapshotSection[];
    if (!sectionsRaw || sectionsRaw.length === 0) return;

    let totalWidgets = 0;
    for (const sec of sectionsRaw) totalWidgets += sec.widgets.length;
    if (sectionsRaw.length > maxSnapshotSections) {
      throw new Error(`snapshot exceeds maximum section limit (${maxSnapshotSections})`);
    }
    if (totalWidgets > maxSnapshotWidgets) {
      throw new Error(`snapshot exceeds maximum widget limit (${maxSnapshotWidgets})`);
    }

    for (const sec of sectionsRaw) {
      const configB = JSON.stringify(sec.config);
      const visB = JSON.stringify(sec.visibilityRule);

      const result = await q(
        `INSERT INTO public.report_template_sections
           (organization_id, template_id, type, order_index, config, is_optional, visibility_rule)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [orgID, templateID, sec.type, sec.orderIndex, configB, sec.isOptional, visB]
      );
      const secID = result.rows[0].id;

      for (const w of sec.widgets) {
        const bindB = JSON.stringify(w.dataBinding);
        const styleB = JSON.stringify(w.styleConfig);
        await q(
          `INSERT INTO public.report_template_widgets
             (organization_id, section_id, widget_type, data_binding, style_config, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orgID, secID, w.widgetType, bindB, styleB, w.orderIndex]
        );
      }
    }
  }

  private mapTemplateRow(r: any): TemplateDTO {
    return {
      id: r.id,
      organizationID: r.organization_id,
      name: r.name,
      description: r.description,
      category: r.category,
      industryTag: r.industry_tag,
      previewURL: r.preview_url,
      exportFormat: r.export_format,
      language: r.language,
      scope: r.scope,
      currentVersion: parseInt(r.current_version, 10),
      usageCount: parseInt(r.usage_count, 10),
      sourceTemplateID: r.source_template_id,
      sourceVersion: r.source_version,
      isActive: r.is_active,
      createdBy: r.created_by,
      updatedBy: r.updated_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
