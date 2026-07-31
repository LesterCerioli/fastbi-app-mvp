import { v4 as uuidv4 } from "uuid";
import { query } from "../db";

export enum WidgetType {
  KPICard = "kpi_card",
  BarChart = "bar_chart",
  LineChart = "line_chart",
  PieChart = "pie_chart",
  Table = "table",
  Gauge = "gauge",
  Heatmap = "heatmap",
  Text = "text",
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  layout: Record<string, unknown>;
  widgets: unknown[];
  tags: string[];
  thumbnail_url?: string;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Dashboard {
  id: string;
  dashboard_id: string;
  organization_id: string;
  template_id?: string | null;
  name: string;
  description?: string;
  dataset_ids: unknown[];
  layout: Record<string, unknown>;
  business_context?: string;
  refresh_rate?: string;
  is_public: boolean;
  is_default: boolean;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Date;
  updated_at: Date;
  widgets?: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  organization_id: string;
  widget_type: WidgetType;
  title?: string;
  description?: string;
  kpi_id?: string | null;
  config: Record<string, unknown>;
  position: Record<string, unknown>;
  size: Record<string, unknown>;
  refresh_interval: number;
  is_visible: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  layout: Record<string, unknown>;
  widgets: unknown[];
  tags?: string[];
  thumbnail_url?: string;
  created_by?: string | null;
}

export interface UpdateTemplateRequest {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  layout?: Record<string, unknown>;
  widgets?: unknown[];
  tags?: string[];
  thumbnail_url?: string | null;
  is_active?: boolean | null;
  updated_by?: string | null;
}

export interface CreateDashboardRequest {
  organization_name: string;
  template_id?: string | null;
  dashboard_id?: string;
  name: string;
  description?: string;
  dataset_ids?: unknown[];
  layout?: Record<string, unknown>;
  business_context?: string;
  refresh_rate?: string;
  is_public?: boolean;
  is_default?: boolean;
  created_by?: string | null;
}

export interface UpdateDashboardRequest {
  name?: string | null;
  description?: string | null;
  dataset_ids?: unknown[];
  layout?: Record<string, unknown>;
  business_context?: string | null;
  refresh_rate?: string | null;
  is_public?: boolean | null;
  is_default?: boolean | null;
  is_active?: boolean | null;
  updated_by?: string | null;
}

export interface AddWidgetRequest {
  organization_name: string;
  widget_type: WidgetType;
  title?: string;
  description?: string;
  kpi_id?: string | null;
  config?: Record<string, unknown>;
  position?: Record<string, unknown>;
  size?: Record<string, unknown>;
  refresh_interval?: number;
  sort_order?: number;
  created_by?: string | null;
}

export interface UpdateWidgetRequest {
  widget_type?: WidgetType | null;
  title?: string | null;
  description?: string | null;
  kpi_id?: string | null;
  config?: Record<string, unknown>;
  position?: Record<string, unknown>;
  size?: Record<string, unknown>;
  refresh_interval?: number | null;
  is_visible?: boolean | null;
  sort_order?: number | null;
  updated_by?: string | null;
}

export interface TemplateFilter {
  category?: string | null;
  is_active?: boolean | null;
  tag?: string | null;
  limit?: number;
  offset?: number;
}

export interface DashboardFilter {
  is_active?: boolean | null;
  business_context?: string | null;
  limit?: number;
  offset?: number;
}

export class DashboardService {
  private async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (!result.rows[0]) {
      throw new Error(`organization not found: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  async ResolveOrganizationID(organizationName: string): Promise<string> {
    return this.resolveOrganizationID(organizationName);
  }

  async ResolveTemplateIDByName(name: string): Promise<string> {
    if (!name) {
      throw new Error("template name is required");
    }
    const result = await query(
      `SELECT id FROM public.dashboard_templates WHERE name = $1`,
      [name]
    );
    if (result.rows.length === 0) {
      throw new Error(`dashboard template not found: ${name}`);
    }
    if (result.rows.length > 1) {
      throw new Error(`ambiguous template name "${name}": multiple templates found`);
    }
    return result.rows[0].id;
  }

  async ResolveDashboardBySlug(slug: string): Promise<{ id: string; organization_id: string }> {
    if (!slug) {
      throw new Error("dashboard slug is required");
    }
    const result = await query(
      `SELECT id, organization_id FROM public.dashboards WHERE dashboard_id = $1`,
      [slug]
    );
    if (!result.rows[0]) {
      throw new Error("dashboard not found");
    }
    return { id: result.rows[0].id, organization_id: result.rows[0].organization_id };
  }

  async ResolveWidgetIDByTitle(dashboardID: string, title: string): Promise<string> {
    if (!title) {
      throw new Error("widget title is required");
    }
    const result = await query(
      `SELECT id FROM public.dashboard_widgets WHERE dashboard_id = $1 AND title = $2`,
      [dashboardID, title]
    );
    if (result.rows.length === 0) {
      throw new Error("widget not found");
    }
    if (result.rows.length > 1) {
      throw new Error(`ambiguous widget title "${title}": multiple widgets found in this dashboard`);
    }
    return result.rows[0].id;
  }

  async CreateTemplate(req: CreateTemplateRequest): Promise<DashboardTemplate> {
    if (!req.name) {
      throw new Error("name is required");
    }

    const layoutJSON = JSON.stringify(req.layout);
    const widgetsJSON = JSON.stringify(req.widgets);
    const tagsArray = this.stringSliceToArray(req.tags || []);

    const result = await query(
      `INSERT INTO public.dashboard_templates
        (name, description, category, layout, widgets, tags, thumbnail_url, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $8)
       RETURNING id, created_at, updated_at`,
      [
        req.name, req.description || "", req.category || "",
        layoutJSON, widgetsJSON, tagsArray,
        req.thumbnail_url || "", req.created_by || null,
      ]
    );

    return this.GetTemplateByID(result.rows[0].id);
  }

  async GetTemplateByID(id: string): Promise<DashboardTemplate> {
    const result = await query(
      `SELECT id, name, description, category, layout, widgets, tags,
              thumbnail_url, is_active, created_by, updated_by, created_at, updated_at
       FROM public.dashboard_templates
       WHERE id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      throw new Error("dashboard template not found");
    }

    const row = result.rows[0];
    const t: DashboardTemplate = {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      category: row.category || undefined,
      layout: typeof row.layout === "string" ? JSON.parse(row.layout) : (row.layout || {}),
      widgets: typeof row.widgets === "string" ? JSON.parse(row.widgets) : (row.widgets || []),
      tags: row.tags ? this.arrayToStringSlice(row.tags) : [],
      thumbnail_url: row.thumbnail_url || undefined,
      is_active: row.is_active,
      created_by: row.created_by || null,
      updated_by: row.updated_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return t;
  }

  async ListTemplates(filter: TemplateFilter): Promise<[DashboardTemplate[], number]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramCounter = 1;

    if (filter.category) {
      conditions.push(`category = $${paramCounter++}`);
      params.push(filter.category);
    }
    if (filter.is_active !== undefined && filter.is_active !== null) {
      conditions.push(`is_active = $${paramCounter++}`);
      params.push(filter.is_active);
    }
    if (filter.tag) {
      conditions.push(`$${paramCounter++} = ANY(tags)`);
      params.push(filter.tag);
    }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const countResult = await query(
      `SELECT COUNT(*) as count FROM public.dashboard_templates ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const offset = filter.offset && filter.offset > 0 ? filter.offset : 0;

    const dataResult = await query(
      `SELECT id, name, description, category, layout, widgets, tags,
              thumbnail_url, is_active, created_by, updated_by, created_at, updated_at
       FROM public.dashboard_templates
       ${where}
       ORDER BY created_at DESC
       LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      [...params, limit, offset]
    );

    const templates: DashboardTemplate[] = dataResult.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || undefined,
      category: (row.category as string) || undefined,
      layout: typeof row.layout === "string" ? JSON.parse(row.layout as string) : ((row.layout as Record<string, unknown>) || {}),
      widgets: typeof row.widgets === "string" ? JSON.parse(row.widgets as string) : ((row.widgets as unknown[]) || []),
      tags: row.tags ? this.arrayToStringSlice(row.tags as string) : [],
      thumbnail_url: (row.thumbnail_url as string) || undefined,
      is_active: row.is_active as boolean,
      created_by: (row.created_by as string) || null,
      updated_by: (row.updated_by as string) || null,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
    }));

    return [templates, total];
  }

  async UpdateTemplate(id: string, req: UpdateTemplateRequest): Promise<DashboardTemplate> {
    const setParts: string[] = [];
    const params: unknown[] = [];
    let paramCounter = 1;

    if (req.name !== undefined && req.name !== null) {
      setParts.push(`name = $${paramCounter++}`);
      params.push(req.name);
    }
    if (req.description !== undefined && req.description !== null) {
      setParts.push(`description = $${paramCounter++}`);
      params.push(req.description);
    }
    if (req.category !== undefined && req.category !== null) {
      setParts.push(`category = $${paramCounter++}`);
      params.push(req.category);
    }
    if (req.layout !== undefined) {
      setParts.push(`layout = $${paramCounter++}`);
      params.push(JSON.stringify(req.layout));
    }
    if (req.widgets !== undefined) {
      setParts.push(`widgets = $${paramCounter++}`);
      params.push(JSON.stringify(req.widgets));
    }
    if (req.tags !== undefined) {
      setParts.push(`tags = $${paramCounter++}`);
      params.push(this.stringSliceToArray(req.tags));
    }
    if (req.thumbnail_url !== undefined && req.thumbnail_url !== null) {
      setParts.push(`thumbnail_url = $${paramCounter++}`);
      params.push(req.thumbnail_url);
    }
    if (req.is_active !== undefined && req.is_active !== null) {
      setParts.push(`is_active = $${paramCounter++}`);
      params.push(req.is_active);
    }
    if (req.updated_by !== undefined && req.updated_by !== null) {
      setParts.push(`updated_by = $${paramCounter++}`);
      params.push(req.updated_by);
    }

    if (setParts.length === 0) {
      return this.GetTemplateByID(id);
    }

    setParts.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const result = await query(
      `UPDATE public.dashboard_templates SET ${setParts.join(", ")} WHERE id = $${paramCounter}`,
      params
    );

    if (result.rowCount === 0) {
      throw new Error("dashboard template not found");
    }

    return this.GetTemplateByID(id);
  }

  async DeleteTemplate(id: string): Promise<void> {
    const result = await query(
      `UPDATE public.dashboard_templates SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error("dashboard template not found");
    }
  }

  async CreateDashboard(req: CreateDashboardRequest): Promise<Dashboard> {
    if (!req.name) {
      throw new Error("name is required");
    }
    if (!req.organization_name) {
      throw new Error("organization_name is required");
    }

    const orgID = await this.resolveOrganizationID(req.organization_name);

    if (req.is_default) {
      await this.clearDefaultDashboard(orgID);
    }

    const slug = req.dashboard_id || this.generateSlug(req.name);

    const layoutJSON = req.layout ? JSON.stringify(req.layout) : "{}";
    const datasetIDsJSON = req.dataset_ids ? JSON.stringify(req.dataset_ids) : "[]";

    const result = await query(
      `INSERT INTO public.dashboards
        (dashboard_id, organization_id, template_id, name, description,
         dataset_ids, layout, business_context, refresh_rate, is_public,
         is_default, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, $12)
       RETURNING id, created_at, updated_at`,
      [
        slug, orgID, req.template_id || null, req.name, req.description || "",
        datasetIDsJSON, layoutJSON, req.business_context || "", req.refresh_rate || "",
        req.is_public || false, req.is_default || false, req.created_by || null,
      ]
    );

    const id = result.rows[0].id;

    if (req.template_id) {
      try {
        await this.populateWidgetsFromTemplate(id, orgID, req.template_id);
      } catch (err) {
        console.warn(`Warning: failed to populate widgets from template: ${err}`);
      }
    }

    return this.GetDashboardByID(id, orgID);
  }

  async GetDashboardByID(id: string, organizationID: string): Promise<Dashboard> {
    const result = await query(
      `SELECT id, dashboard_id, organization_id, template_id, name, description,
              dataset_ids, layout, business_context, refresh_rate, is_public,
              is_default, is_active, created_by, updated_by, created_at, updated_at
       FROM public.dashboards
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, organizationID]
    );

    if (!result.rows[0]) {
      throw new Error("dashboard not found");
    }

    const row = result.rows[0];
    const d: Dashboard = {
      id: row.id,
      dashboard_id: row.dashboard_id,
      organization_id: row.organization_id,
      template_id: row.template_id || null,
      name: row.name,
      description: row.description || undefined,
      dataset_ids: typeof row.dataset_ids === "string" ? JSON.parse(row.dataset_ids) : (row.dataset_ids || []),
      layout: typeof row.layout === "string" ? JSON.parse(row.layout) : (row.layout || {}),
      business_context: row.business_context || undefined,
      refresh_rate: row.refresh_rate || undefined,
      is_public: row.is_public,
      is_default: row.is_default,
      is_active: row.is_active,
      created_by: row.created_by || null,
      updated_by: row.updated_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    try {
      d.widgets = await this.listWidgetsByDashboard(id);
    } catch (err) {
      console.warn(`Warning: failed to load widgets for dashboard ${id}: ${err}`);
      d.widgets = [];
    }

    return d;
  }

  async ListDashboards(organizationID: string, filter: DashboardFilter): Promise<[Dashboard[], number]> {
    const conditions: string[] = ["organization_id = $1", "deleted_at IS NULL"];
    const params: unknown[] = [organizationID];
    let paramCounter = 2;

    if (filter.is_active !== undefined && filter.is_active !== null) {
      conditions.push(`is_active = $${paramCounter++}`);
      params.push(filter.is_active);
    }
    if (filter.business_context) {
      conditions.push(`business_context = $${paramCounter++}`);
      params.push(filter.business_context);
    }

    const where = "WHERE " + conditions.join(" AND ");

    const countResult = await query(
      `SELECT COUNT(*) as count FROM public.dashboards ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const offset = filter.offset && filter.offset > 0 ? filter.offset : 0;

    const dataResult = await query(
      `SELECT id, dashboard_id, organization_id, template_id, name, description,
              dataset_ids, layout, business_context, refresh_rate, is_public,
              is_default, is_active, created_by, updated_by, created_at, updated_at
       FROM public.dashboards
       ${where}
       ORDER BY is_default DESC, created_at DESC
       LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      [...params, limit, offset]
    );

    const dashboards: Dashboard[] = dataResult.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      dashboard_id: row.dashboard_id as string,
      organization_id: row.organization_id as string,
      template_id: (row.template_id as string) || null,
      name: row.name as string,
      description: (row.description as string) || undefined,
      dataset_ids: typeof row.dataset_ids === "string" ? JSON.parse(row.dataset_ids as string) : ((row.dataset_ids as unknown[]) || []),
      layout: typeof row.layout === "string" ? JSON.parse(row.layout as string) : ((row.layout as Record<string, unknown>) || {}),
      business_context: (row.business_context as string) || undefined,
      refresh_rate: (row.refresh_rate as string) || undefined,
      is_public: row.is_public as boolean,
      is_default: row.is_default as boolean,
      is_active: row.is_active as boolean,
      created_by: (row.created_by as string) || null,
      updated_by: (row.updated_by as string) || null,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
      widgets: [],
    }));

    return [dashboards, total];
  }

  async UpdateDashboard(id: string, organizationID: string, req: UpdateDashboardRequest): Promise<Dashboard> {
    if (req.is_default) {
      await this.clearDefaultDashboard(organizationID);
    }

    const setParts: string[] = [];
    const params: unknown[] = [];
    let paramCounter = 1;

    if (req.name !== undefined && req.name !== null) {
      setParts.push(`name = $${paramCounter++}`);
      params.push(req.name);
    }
    if (req.description !== undefined && req.description !== null) {
      setParts.push(`description = $${paramCounter++}`);
      params.push(req.description);
    }
    if (req.dataset_ids !== undefined) {
      setParts.push(`dataset_ids = $${paramCounter++}`);
      params.push(JSON.stringify(req.dataset_ids));
    }
    if (req.layout !== undefined) {
      setParts.push(`layout = $${paramCounter++}`);
      params.push(JSON.stringify(req.layout));
    }
    if (req.business_context !== undefined && req.business_context !== null) {
      setParts.push(`business_context = $${paramCounter++}`);
      params.push(req.business_context);
    }
    if (req.refresh_rate !== undefined && req.refresh_rate !== null) {
      setParts.push(`refresh_rate = $${paramCounter++}`);
      params.push(req.refresh_rate);
    }
    if (req.is_public !== undefined && req.is_public !== null) {
      setParts.push(`is_public = $${paramCounter++}`);
      params.push(req.is_public);
    }
    if (req.is_default !== undefined && req.is_default !== null) {
      setParts.push(`is_default = $${paramCounter++}`);
      params.push(req.is_default);
    }
    if (req.is_active !== undefined && req.is_active !== null) {
      setParts.push(`is_active = $${paramCounter++}`);
      params.push(req.is_active);
    }
    if (req.updated_by !== undefined && req.updated_by !== null) {
      setParts.push(`updated_by = $${paramCounter++}`);
      params.push(req.updated_by);
    }

    if (setParts.length === 0) {
      return this.GetDashboardByID(id, organizationID);
    }

    setParts.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id, organizationID);

    const result = await query(
      `UPDATE public.dashboards SET ${setParts.join(", ")} WHERE id = $${paramCounter} AND organization_id = $${paramCounter + 1} AND deleted_at IS NULL`,
      params
    );

    if (result.rowCount === 0) {
      throw new Error("dashboard not found");
    }

    return this.GetDashboardByID(id, organizationID);
  }

  async DeleteDashboard(id: string, organizationID: string): Promise<void> {
    const result = await query(
      `UPDATE public.dashboards
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, organizationID]
    );

    if (result.rowCount === 0) {
      throw new Error("dashboard not found");
    }
  }

  async AddWidget(dashboardID: string, organizationID: string, req: AddWidgetRequest): Promise<DashboardWidget> {
    if (!req.widget_type) {
      throw new Error("widget_type is required");
    }

    await this.verifyDashboardOwnership(dashboardID, organizationID);

    const configJSON = req.config ? JSON.stringify(req.config) : "{}";
    const position = req.position || { x: 0, y: 0 };
    const positionJSON = JSON.stringify(position);
    const size = req.size || { w: 4, h: 3 };
    const sizeJSON = JSON.stringify(size);
    const refreshInterval = req.refresh_interval && req.refresh_interval > 0 ? req.refresh_interval : 300;

    const result = await query(
      `INSERT INTO public.dashboard_widgets
        (dashboard_id, organization_id, widget_type, title, description, kpi_id,
         config, position, size, refresh_interval, is_visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11)
       RETURNING id, created_at, updated_at`,
      [
        dashboardID, organizationID, req.widget_type,
        req.title || "", req.description || "", req.kpi_id || null,
        configJSON, positionJSON, sizeJSON,
        refreshInterval, req.sort_order || 0,
      ]
    );

    return this.GetWidgetByID(result.rows[0].id, dashboardID, organizationID);
  }

  async GetWidgetByID(id: string, dashboardID: string, organizationID: string): Promise<DashboardWidget> {
    const result = await query(
      `SELECT id, dashboard_id, organization_id, widget_type, title, description,
              kpi_id, config, position, size, refresh_interval, is_visible, sort_order,
              created_at, updated_at
       FROM public.dashboard_widgets
       WHERE id = $1 AND dashboard_id = $2 AND organization_id = $3`,
      [id, dashboardID, organizationID]
    );

    if (!result.rows[0]) {
      throw new Error("widget not found");
    }

    const row = result.rows[0];
    return {
      id: row.id,
      dashboard_id: row.dashboard_id,
      organization_id: row.organization_id,
      widget_type: row.widget_type as WidgetType,
      title: row.title || undefined,
      description: row.description || undefined,
      kpi_id: row.kpi_id || null,
      config: typeof row.config === "string" ? JSON.parse(row.config) : (row.config || {}),
      position: typeof row.position === "string" ? JSON.parse(row.position) : (row.position || {}),
      size: typeof row.size === "string" ? JSON.parse(row.size) : (row.size || {}),
      refresh_interval: row.refresh_interval,
      is_visible: row.is_visible,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async UpdateWidget(id: string, dashboardID: string, organizationID: string, req: UpdateWidgetRequest): Promise<DashboardWidget> {
    await this.verifyDashboardOwnership(dashboardID, organizationID);

    const setParts: string[] = [];
    const params: unknown[] = [];
    let paramCounter = 1;

    if (req.widget_type !== undefined && req.widget_type !== null) {
      setParts.push(`widget_type = $${paramCounter++}`);
      params.push(req.widget_type);
    }
    if (req.title !== undefined && req.title !== null) {
      setParts.push(`title = $${paramCounter++}`);
      params.push(req.title);
    }
    if (req.description !== undefined && req.description !== null) {
      setParts.push(`description = $${paramCounter++}`);
      params.push(req.description);
    }
    if (req.kpi_id !== undefined && req.kpi_id !== null) {
      setParts.push(`kpi_id = $${paramCounter++}`);
      params.push(req.kpi_id);
    }
    if (req.config !== undefined) {
      setParts.push(`config = $${paramCounter++}`);
      params.push(JSON.stringify(req.config));
    }
    if (req.position !== undefined) {
      setParts.push(`position = $${paramCounter++}`);
      params.push(JSON.stringify(req.position));
    }
    if (req.size !== undefined) {
      setParts.push(`size = $${paramCounter++}`);
      params.push(JSON.stringify(req.size));
    }
    if (req.refresh_interval !== undefined && req.refresh_interval !== null) {
      setParts.push(`refresh_interval = $${paramCounter++}`);
      params.push(req.refresh_interval);
    }
    if (req.is_visible !== undefined && req.is_visible !== null) {
      setParts.push(`is_visible = $${paramCounter++}`);
      params.push(req.is_visible);
    }
    if (req.sort_order !== undefined && req.sort_order !== null) {
      setParts.push(`sort_order = $${paramCounter++}`);
      params.push(req.sort_order);
    }

    if (setParts.length === 0) {
      return this.GetWidgetByID(id, dashboardID, organizationID);
    }

    setParts.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id, dashboardID, organizationID);

    const result = await query(
      `UPDATE public.dashboard_widgets SET ${setParts.join(", ")} WHERE id = $${paramCounter} AND dashboard_id = $${paramCounter + 1} AND organization_id = $${paramCounter + 2}`,
      params
    );

    if (result.rowCount === 0) {
      throw new Error("widget not found");
    }

    return this.GetWidgetByID(id, dashboardID, organizationID);
  }

  async DeleteWidget(id: string, dashboardID: string, organizationID: string): Promise<void> {
    await this.verifyDashboardOwnership(dashboardID, organizationID);

    const result = await query(
      `DELETE FROM public.dashboard_widgets WHERE id = $1 AND dashboard_id = $2 AND organization_id = $3`,
      [id, dashboardID, organizationID]
    );

    if (result.rowCount === 0) {
      throw new Error("widget not found");
    }
  }

  async ListWidgets(dashboardID: string, organizationID: string): Promise<DashboardWidget[]> {
    await this.verifyDashboardOwnership(dashboardID, organizationID);
    return this.listWidgetsByDashboard(dashboardID);
  }

  private async listWidgetsByDashboard(dashboardID: string): Promise<DashboardWidget[]> {
    const result = await query(
      `SELECT id, dashboard_id, organization_id, widget_type, title, description,
              kpi_id, config, position, size, refresh_interval, is_visible, sort_order,
              created_at, updated_at
       FROM public.dashboard_widgets
       WHERE dashboard_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [dashboardID]
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      dashboard_id: row.dashboard_id as string,
      organization_id: row.organization_id as string,
      widget_type: row.widget_type as WidgetType,
      title: (row.title as string) || undefined,
      description: (row.description as string) || undefined,
      kpi_id: (row.kpi_id as string) || null,
      config: typeof row.config === "string" ? JSON.parse(row.config as string) : ((row.config as Record<string, unknown>) || {}),
      position: typeof row.position === "string" ? JSON.parse(row.position as string) : ((row.position as Record<string, unknown>) || {}),
      size: typeof row.size === "string" ? JSON.parse(row.size as string) : ((row.size as Record<string, unknown>) || {}),
      refresh_interval: row.refresh_interval as number,
      is_visible: row.is_visible as boolean,
      sort_order: row.sort_order as number,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
    }));
  }

  private async verifyDashboardOwnership(dashboardID: string, organizationID: string): Promise<void> {
    const result = await query(
      `SELECT COUNT(*) as count FROM public.dashboards WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [dashboardID, organizationID]
    );
    const count = parseInt(result.rows[0]?.count || "0", 10);
    if (count === 0) {
      throw new Error("dashboard not found");
    }
  }

  private async clearDefaultDashboard(organizationID: string): Promise<void> {
    await query(
      `UPDATE public.dashboards SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP WHERE organization_id = $1 AND is_default = TRUE AND deleted_at IS NULL`,
      [organizationID]
    );
  }

  private async populateWidgetsFromTemplate(dashboardID: string, organizationID: string, templateID: string): Promise<void> {
    const templateResult = await query(
      `SELECT widgets FROM public.dashboard_templates WHERE id = $1 AND is_active = TRUE`,
      [templateID]
    );

    if (!templateResult.rows[0]) {
      throw new Error("template not found or inactive");
    }

    let widgetDefs: Record<string, unknown>[];
    try {
      widgetDefs = typeof templateResult.rows[0].widgets === "string"
        ? JSON.parse(templateResult.rows[0].widgets)
        : (templateResult.rows[0].widgets || []);
    } catch {
      return;
    }

    if (widgetDefs.length === 0) return;

    for (let i = 0; i < widgetDefs.length; i++) {
      const def = widgetDefs[i];
      const widgetType = (def.widget_type as string) || WidgetType.KPICard;
      const title = (def.title as string) || "";
      const description = (def.description as string) || "";

      let configJSON = def.config ? JSON.stringify(def.config) : "{}";
      let positionJSON = def.position ? JSON.stringify(def.position) : JSON.stringify({ x: 0, y: 0 });
      let sizeJSON = def.size ? JSON.stringify(def.size) : JSON.stringify({ w: 4, h: 3 });

      if (configJSON === "null") configJSON = "{}";
      if (positionJSON === "null") positionJSON = JSON.stringify({ x: 0, y: 0 });
      if (sizeJSON === "null") sizeJSON = JSON.stringify({ w: 4, h: 3 });

      try {
        await query(
          `INSERT INTO public.dashboard_widgets
            (dashboard_id, organization_id, widget_type, title, description,
             config, position, size, refresh_interval, is_visible, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 300, TRUE, $9)`,
          [dashboardID, organizationID, widgetType, title, description,
           configJSON, positionJSON, sizeJSON, i]
        );
      } catch (err) {
        console.warn(`Warning: failed to insert template widget ${i}: ${err}`);
      }
    }
  }

  private generateSlug(name: string): string {
    let slug = name.toLowerCase().trim();
    slug = slug.replace(/\s+/g, "-");
    const suffix = uuidv4().replace(/-/g, "").substring(0, 8);
    return `${slug}-${suffix}`;
  }

  private stringSliceToArray(slice: string[]): string {
    if (slice.length === 0) return "{}";
    const escaped = slice.map((s) => `"${s.replace(/"/g, '\\"')}"`);
    return "{" + escaped.join(",") + "}";
  }

  private arrayToStringSlice(pgArray: string): string[] {
    let str = pgArray;
    str = str.replace(/^\{/, "").replace(/\}$/, "");
    if (!str) return [];
    return str.split(",").map((p) => p.trim().replace(/^"|"$/g, "")).filter(Boolean);
  }
}
