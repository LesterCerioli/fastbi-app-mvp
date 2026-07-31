import { query } from "../db";
import { ExecutiveAnalyticsImpl } from "./executive_analytics_impl";

const impl = new ExecutiveAnalyticsImpl();

export class ExecutiveAnalyticsService {
  private async resolveOrganizationID(organizationName: string): Promise<string> {
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

  async compareSeasonality(organizationName: string, granularity?: string, compareYears?: number[]) {
    const organizationId = await this.resolveOrganizationID(organizationName);
    return impl.compareSeasonality({
      organizationId,
      granularity: granularity || "month",
      compareYears: compareYears || [],
    });
  }

  async calculateGrowth(
    organizationName: string,
    startDate: string,
    endDate: string,
    interval?: string,
    includeCAGR?: boolean,
  ) {
    const organizationId = await this.resolveOrganizationID(organizationName);
    return impl.calculateGrowth({
      organizationId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      interval: interval || "month",
      includeCAGR: includeCAGR !== undefined ? includeCAGR : true,
    });
  }

  async comparePeriods(
    organizationName: string,
    period1: { label: string; start_date: string; end_date: string },
    period2: { label: string; start_date: string; end_date: string },
    groupBy?: string,
  ) {
    const organizationId = await this.resolveOrganizationID(organizationName);
    return impl.comparePeriods({
      organizationId,
      period1: {
        label: period1.label,
        startDate: new Date(period1.start_date),
        endDate: new Date(period1.end_date),
      },
      period2: {
        label: period2.label,
        startDate: new Date(period2.start_date),
        endDate: new Date(period2.end_date),
      },
      groupBy: groupBy || "category",
    });
  }

  async getExecutiveSummary(organizationName: string, currentDate?: string, lookbackDays?: number) {
    const organizationId = await this.resolveOrganizationID(organizationName);
    return impl.getExecutiveSummary({
      organizationId,
      currentDate: currentDate ? new Date(currentDate) : new Date(),
      lookbackDays: lookbackDays || 90,
    });
  }
}
