import { query } from "../db";
import { AnomalyDetector } from "../ai/anomaly_detector";
import { EventBusImpl, Topic, EventType } from "./event_bus_impl";

export class AnomalyStreamServiceImpl {
  constructor(
    private eventBus: EventBusImpl,
    private detector: AnomalyDetector,
  ) {}

  async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) {
      throw new Error("organization_name is required");
    }
    const result = await query(
      `SELECT id FROM public.organizations WHERE name = $1`,
      [organizationName],
    );
    if (result.rows.length === 0) {
      throw new Error(`organization not found: ${organizationName}`);
    }
    return result.rows[0].id;
  }

  publishAnomaly(
    tenantId: string,
    metric: string,
    value: number,
    expected: number,
    zScore: number,
  ): void {
    const payload: Record<string, unknown> = {
      metric,
      value,
      expected_value: expected,
      z_score: zScore,
    };
    const event = this.eventBus.newStreamEvent(
      Topic.Anomaly,
      EventType.AnomalyDetected,
      tenantId,
      payload,
    );
    this.eventBus.publish(Topic.Anomaly, event);
  }

  async runScan(
    tenantId: string,
    values: number[],
    threshold: number,
  ): Promise<void> {
    if (values.length === 0) {
      throw new Error("values array is empty");
    }
    if (threshold <= 0) {
      threshold = 2.5;
    }

    const results = this.detector.detectZScore(values, threshold);
    for (const r of results) {
      if (r.isAnomaly) {
        this.publishAnomaly(tenantId, "scan", r.value, r.expectedValue, r.zScore);
      }
    }
  }
}
