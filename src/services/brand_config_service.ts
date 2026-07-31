import { query } from "./db";

export interface BrandConfig {
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  tenant_name: string;
  report_title_template: string;
  report_period: string;
}

export class BrandConfigService {
  async create(orgID: string, config: BrandConfig): Promise<void> {
    const logoURL = config.logo_url ? config.logo_url : null;

    try {
      await query(
        `INSERT INTO public.organization_brand_configs
           (organization_id, logo_url, primary_color, accent_color, tenant_name,
            report_title_template, report_period)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orgID, logoURL, config.primary_color, config.accent_color, config.tenant_name,
         config.report_title_template || null, config.report_period || null]
      );
    } catch (err: any) {
      if (err.message && (err.message.includes("23505") || err.message.includes("duplicate key"))) {
        throw new Error("brand config already exists for this organization — use PUT to update");
      }
      throw err;
    }
  }

  async update(orgID: string, config: BrandConfig): Promise<void> {
    const logoURL = config.logo_url ? config.logo_url : null;

    const result = await query(
      `UPDATE public.organization_brand_configs
       SET logo_url              = $2,
           primary_color         = $3,
           accent_color          = $4,
           tenant_name           = $5,
           report_title_template = $6,
           report_period         = $7,
           updated_at            = CURRENT_TIMESTAMP
       WHERE organization_id = $1`,
      [orgID, logoURL, config.primary_color, config.accent_color, config.tenant_name,
       config.report_title_template || null, config.report_period || null]
    );

    if (result.rowCount === 0) {
      throw new Error("brand config not found for this organization — use POST to create it first");
    }
  }

  async getByOrganization(orgID: string): Promise<BrandConfig> {
    const result = await query(
      `SELECT logo_url, primary_color, accent_color, tenant_name,
              report_title_template, report_period
       FROM public.organization_brand_configs
       WHERE organization_id = $1`,
      [orgID]
    );

    if (!result.rows[0]) {
      throw new Error(`brand config not found for organization ${orgID}`);
    }

    const row = result.rows[0];
    const cfg: BrandConfig = {
      primary_color: row.primary_color,
      accent_color: row.accent_color,
      tenant_name: row.tenant_name,
      report_title_template: row.report_title_template || "",
      report_period: row.report_period || "",
    };
    if (row.logo_url) cfg.logo_url = row.logo_url;

    return cfg;
  }

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) throw new Error("organization_name is required");

    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );

    if (!result.rows[0]) {
      throw new Error(`organization not found: ${organizationName}`);
    }

    return result.rows[0].id;
  }
}
