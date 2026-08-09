import { query } from "../db";

export interface SystemHealthServiceDTO {
  service_name: string;
  status: string;
  uptime_percent: number | null;
  response_time_ms: number | null;
}

export interface SystemHealthResourcesDTO {
  collected_at: string;
  cpu_usage_percent: number | null;
  memory_usage_percent: number | null;
  disk_usage_percent: number | null;
  network_usage_percent: number | null;
}

export interface SystemHealthDTO {
  organization_name: string;
  services: SystemHealthServiceDTO[];
  resources: SystemHealthResourcesDTO | null;
}

export class SystemHealthService {
  private async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization_name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName]
    );
    if (!result.rows[0]) {
      throw new Error(`organization not found with name: ${organizationName}`);
    }
    return result.rows[0].id as string;
  }

  async getSystemHealth(organizationName: string): Promise<SystemHealthDTO> {
    if (!organizationName) throw new Error("organization_name is required");

    const organizationID = await this.resolveOrganizationID(organizationName);

    const services = await query(
      `SELECT DISTINCT ON (service_name)
         service_name,
         status,
         uptime_percent,
         response_time_ms,
         collected_at
       FROM public.system_health_metrics
       WHERE organization_id = $1
       ORDER BY service_name, collected_at DESC`,
      [organizationID]
    );

    const resources = await query(
      `SELECT
         collected_at,
         cpu_usage_percent,
         memory_usage_percent,
         disk_usage_percent,
         network_usage_percent
       FROM public.system_health_metrics
       WHERE organization_id = $1
         AND (cpu_usage_percent IS NOT NULL
              OR memory_usage_percent IS NOT NULL
              OR disk_usage_percent IS NOT NULL
              OR network_usage_percent IS NOT NULL)
       ORDER BY collected_at DESC
       LIMIT 1`,
      [organizationID]
    );

    const resourceRow = resources.rows[0];

    return {
      organization_name: organizationName,
      services: services.rows.map((r: Record<string, unknown>) => ({
        service_name: r.service_name as string,
        status: r.status as string,
        uptime_percent: r.uptime_percent != null ? Number(r.uptime_percent) : null,
        response_time_ms: r.response_time_ms != null ? Number(r.response_time_ms) : null,
      })),
      resources: resourceRow
        ? {
            collected_at: (resourceRow.collected_at as Date).toISOString(),
            cpu_usage_percent: resourceRow.cpu_usage_percent != null ? Number(resourceRow.cpu_usage_percent) : null,
            memory_usage_percent: resourceRow.memory_usage_percent != null ? Number(resourceRow.memory_usage_percent) : null,
            disk_usage_percent: resourceRow.disk_usage_percent != null ? Number(resourceRow.disk_usage_percent) : null,
            network_usage_percent: resourceRow.network_usage_percent != null ? Number(resourceRow.network_usage_percent) : null,
          }
        : null,
    };
  }
}