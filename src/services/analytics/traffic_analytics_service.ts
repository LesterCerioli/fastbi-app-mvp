import { query } from "../db";

export interface TrafficDailyTrendDTO {
  metric_date: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number | null;
  avg_session_seconds: number | null;
}

export interface TrafficChannelDTO {
  channel: string;
  page_views: number;
  unique_visitors: number;
}

export interface TrafficMetricsDTO {
  organization_name: string;
  total_page_views: number;
  total_unique_visitors: number;
  avg_bounce_rate: number | null;
  avg_session_seconds: number | null;
  dailyTrend: TrafficDailyTrendDTO[];
  byChannel: TrafficChannelDTO[];
}

export class TrafficAnalyticsService {
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

  async getTrafficMetrics(organizationName: string, days = 30): Promise<TrafficMetricsDTO> {
    if (!organizationName) throw new Error("organization_name is required");

    const organizationID = await this.resolveOrganizationID(organizationName);

    const summary = await query(
      `SELECT
         COALESCE(SUM(page_views), 0)::bigint AS total_page_views,
         COALESCE(SUM(unique_visitors), 0)::bigint AS total_unique_visitors,
         COALESCE(AVG(bounce_rate), 0) AS avg_bounce_rate,
         COALESCE(AVG(avg_session_seconds), 0)::bigint AS avg_session_seconds
       FROM public.traffic_analytics
       WHERE organization_id = $1
         AND metric_date >= CURRENT_DATE - $2::int`,
      [organizationID, days]
    );

    const dailyTrend = await query(
      `SELECT
         metric_date,
         SUM(page_views) AS page_views,
         SUM(unique_visitors) AS unique_visitors,
         AVG(bounce_rate) AS bounce_rate,
         AVG(avg_session_seconds) AS avg_session_seconds
       FROM public.traffic_analytics
       WHERE organization_id = $1
         AND metric_date >= CURRENT_DATE - $2::int
       GROUP BY metric_date
       ORDER BY metric_date ASC`,
      [organizationID, days]
    );

    const byChannel = await query(
      `SELECT
         COALESCE(NULLIF(channel, ''), 'unknown') AS channel,
         SUM(page_views) AS page_views,
         SUM(unique_visitors) AS unique_visitors
       FROM public.traffic_analytics
       WHERE organization_id = $1
         AND metric_date >= CURRENT_DATE - $2::int
       GROUP BY channel
       ORDER BY page_views DESC`,
      [organizationID, days]
    );

    const row = summary.rows[0] || {};

    return {
      organization_name: organizationName,
      total_page_views: Number(row.total_page_views || 0),
      total_unique_visitors: Number(row.total_unique_visitors || 0),
      avg_bounce_rate: row.avg_bounce_rate != null ? Number(row.avg_bounce_rate) : null,
      avg_session_seconds: row.avg_session_seconds != null ? Number(row.avg_session_seconds) : null,
      dailyTrend: dailyTrend.rows.map((r: Record<string, unknown>) => ({
        metric_date: (r.metric_date as Date).toISOString().slice(0, 10),
        page_views: Number(r.page_views || 0),
        unique_visitors: Number(r.unique_visitors || 0),
        bounce_rate: r.bounce_rate != null ? Number(r.bounce_rate) : null,
        avg_session_seconds: r.avg_session_seconds != null ? Number(r.avg_session_seconds) : null,
      })),
      byChannel: byChannel.rows.map((r: Record<string, unknown>) => ({
        channel: r.channel as string,
        page_views: Number(r.page_views || 0),
        unique_visitors: Number(r.unique_visitors || 0),
      })),
    };
  }
}