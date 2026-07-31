import { query } from "../db";

export interface DeviationAlert {
  kpiID: string;
  kpiName: string;
  category: string;
  currentValue: number;
  previousValue: number;
  deviation: number;
  deviationPerc: number;
  severity: string;
  message: string;
  alertID?: string;
  triggeredAt?: Date;
}

export interface DeviationAnalysisResult {
  alerts: DeviationAlert[];
  totalKPIsChecked: number;
  totalDeviationAlerts: number;
  checkedAt: Date;
}

export interface DeviationThreshold {
  kpiID: string;
  upperDeviationThreshold?: number;
  lowerDeviationThreshold?: number;
  upperPercentThreshold?: number;
  lowerPercentThreshold?: number;
  severity: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  "critical": "critical",
  "warning": "warning",
  "info": "info",
};

export class KpiDeviationAnalyzerService {
  async analyzeKpiDeviation(organizationID: string, kpiIDs: string[]): Promise<DeviationAnalysisResult> {
    const alerts: DeviationAlert[] = [];
    const checkedAt = new Date();

    for (const kpiID of kpiIDs) {
      const currentVal = await this.getCurrentKPIValue(kpiID);
      const previousVal = await this.getPreviousKPIValue(kpiID);
      const threshold = await this.getDeviationThreshold(kpiID, organizationID);
      const kpiInfo = await this.getKpiInfo(kpiID);

      if (kpiInfo === null) continue;

      if (currentVal !== null && previousVal !== null && previousVal !== 0) {
        const deviation = currentVal - previousVal;
        const deviationPerc = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;

        const exceedsThreshold = this.exceedsThreshold(deviation, deviationPerc, threshold);
        if (exceedsThreshold || (threshold && !threshold.upperDeviationThreshold && !threshold.lowerDeviationThreshold)) {
          const severity = threshold?.severity || "info";
          const alert: DeviationAlert = {
            kpiID,
            kpiName: kpiInfo.name,
            category: kpiInfo.category,
            currentValue: currentVal,
            previousValue: previousVal,
            deviation,
            deviationPerc,
            severity: SEVERITY_LABELS[severity] || "info",
            message: `KPI "${kpiInfo.name}" change: ${this.formatNum(previousVal)} → ${this.formatNum(currentVal)} (${deviationPerc >= 0 ? "+" : ""}${deviationPerc.toFixed(2)}%)`,
          };
          alerts.push(alert);
        }
      }
    }

    const insertionResult = await query(
      `INSERT INTO public.kpi_deviation_alerts (organization_id, alerts_json, kpis_checked, alerts_count, checked_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [organizationID, JSON.stringify(alerts), kpiIDs.length, alerts.length, checkedAt]
    );

    for (let i = 0; i < alerts.length; i++) {
      alerts[i].alertID = insertionResult.rows[0]?.id || "";
      alerts[i].triggeredAt = checkedAt;
    }

    return {
      alerts,
      totalKPIsChecked: kpiIDs.length,
      totalDeviationAlerts: alerts.length,
      checkedAt,
    };
  }

  async getDeviationAlertHistory(organizationID: string, kpiID?: string, limit = 50): Promise<DeviationAlert[]> {
    const result = await query(
      `SELECT alerts_json FROM public.kpi_deviation_alerts
       WHERE organization_id = $1
       ORDER BY checked_at DESC LIMIT $2`,
      [organizationID, limit]
    );
    const alerts: DeviationAlert[] = [];
    for (const row of result.rows) {
      const alertsArr = typeof row.alerts_json === "string" ? JSON.parse(row.alerts_json) : row.alerts_json;
      for (const a of alertsArr) {
        if (kpiID && a.kpiID !== kpiID) continue;
        alerts.push(a);
      }
    }
    return alerts;
  }

  private async getCurrentKPIValue(kpiID: string): Promise<number | null> {
    const result = await query(
      `SELECT value FROM public.kpi_history WHERE kpi_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
      [kpiID]
    );
    if (!result.rows[0]) return null;
    return parseFloat(result.rows[0].value);
  }

  private async getPreviousKPIValue(kpiID: string): Promise<number | null> {
    const result = await query(
      `SELECT value FROM public.kpi_history WHERE kpi_id = $1 ORDER BY calculated_at DESC OFFSET 1 LIMIT 1`,
      [kpiID]
    );
    if (!result.rows[0]) return null;
    return parseFloat(result.rows[0].value);
  }

  private async getDeviationThreshold(kpiID: string, _organizationID: string): Promise<DeviationThreshold | null> {
    const result = await query(
      `SELECT kpi_id, upper_deviation_threshold, lower_deviation_threshold,
              upper_percent_threshold, lower_percent_threshold, severity
       FROM public.kpi_deviation_thresholds WHERE kpi_id = $1`,
      [kpiID]
    );
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      kpiID: r.kpi_id,
      upperDeviationThreshold: r.upper_deviation_threshold,
      lowerDeviationThreshold: r.lower_deviation_threshold,
      upperPercentThreshold: r.upper_percent_threshold,
      lowerPercentThreshold: r.lower_percent_threshold,
      severity: r.severity,
    };
  }

  private async getKpiInfo(kpiID: string): Promise<{ name: string; category: string } | null> {
    const result = await query(`SELECT name, category FROM public.kpis WHERE id = $1`, [kpiID]);
    if (!result.rows[0]) return null;
    return { name: result.rows[0].name, category: result.rows[0].category };
  }

  private exceedsThreshold(deviation: number, deviationPerc: number, threshold: DeviationThreshold | null): boolean {
    if (!threshold) return false;
    if (threshold.upperDeviationThreshold !== undefined && threshold.upperDeviationThreshold !== null) {
      if (deviation > threshold.upperDeviationThreshold) return true;
    }
    if (threshold.lowerDeviationThreshold !== undefined && threshold.lowerDeviationThreshold !== null) {
      if (deviation < threshold.lowerDeviationThreshold) return true;
    }
    if (threshold.upperPercentThreshold !== undefined && threshold.upperPercentThreshold !== null) {
      if (deviationPerc > threshold.upperPercentThreshold) return true;
    }
    if (threshold.lowerPercentThreshold !== undefined && threshold.lowerPercentThreshold !== null) {
      if (deviationPerc < threshold.lowerPercentThreshold) return true;
    }
    return false;
  }

  private formatNum(n: number): string {
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async setDeviationThreshold(
    kpiID: string,
    organizationID: string,
    upperDeviationThreshold?: number,
    lowerDeviationThreshold?: number,
    upperPercentThreshold?: number,
    lowerPercentThreshold?: number,
    severity = "info"
  ): Promise<void> {
    await query(
      `INSERT INTO public.kpi_deviation_thresholds (kpi_id, organization_id, upper_deviation_threshold, lower_deviation_threshold, upper_percent_threshold, lower_percent_threshold, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (kpi_id) DO UPDATE SET upper_deviation_threshold = $3, lower_deviation_threshold = $4,
         upper_percent_threshold = $5, lower_percent_threshold = $6, severity = $7`,
      [kpiID, organizationID, upperDeviationThreshold, lowerDeviationThreshold, upperPercentThreshold, lowerPercentThreshold, severity]
    );
  }
}
