import { v4 as uuid } from "uuid";

export type StreamEventType =
  | "kpi.created"
  | "kpi.updated"
  | "kpi.deleted"
  | "anomaly.detected"
  | "pipeline.result"
  | "report.progress"
  | "report.completed"
  | "metric.tick";

export const EventType = {
  KPICreated: "kpi.created" as StreamEventType,
  KPIUpdated: "kpi.updated" as StreamEventType,
  KPIDeleted: "kpi.deleted" as StreamEventType,
  AnomalyDetected: "anomaly.detected" as StreamEventType,
  PipelineResult: "pipeline.result" as StreamEventType,
  ReportProgress: "report.progress" as StreamEventType,
  ReportCompleted: "report.completed" as StreamEventType,
  MetricTick: "metric.tick" as StreamEventType,
};

export const Topic = {
  All: "all",
  KPI: "kpi",
  Anomaly: "anomaly",
  Metrics: "metrics",
  Pipeline: "pipeline",
  Report: "report",
} as const;

export interface StreamEvent {
  id: string;
  topic: string;
  type: StreamEventType;
  payload: Record<string, unknown>;
  timestamp: Date;
  tenantId: string;
}

interface Subscriber {
  id: string;
  channel: (event: StreamEvent) => void;
}

export class EventBusImpl {
  private subscribers = new Map<string, Subscriber[]>();
  private closed = false;

  publish(topic: string, event: StreamEvent): void {
    if (this.closed) return;

    const targets: Subscriber[] = [];
    const subs = this.subscribers.get(topic);
    if (subs) targets.push(...subs);
    if (topic !== Topic.All) {
      const allSubs = this.subscribers.get(Topic.All);
      if (allSubs) targets.push(...allSubs);
    }

    for (const sub of targets) {
      try {
        sub.channel(event);
      } catch {
        // drop on slow consumer
      }
    }
  }

  subscribe(topic: string): { channel: (event: StreamEvent) => void; id: string } {
    const id = uuid();
    const handlers: ((event: StreamEvent) => void)[] = [];
    const channel = (event: StreamEvent) => {
      for (const h of handlers) h(event);
    };

    const sub: Subscriber = { id, channel };
    const existing = this.subscribers.get(topic) ?? [];
    existing.push(sub);
    this.subscribers.set(topic, existing);

    return {
      channel,
      id,
    };
  }

  unsubscribe(topic: string, subscriberId: string): void {
    const subs = this.subscribers.get(topic);
    if (!subs) return;
    const idx = subs.findIndex((s) => s.id === subscriberId);
    if (idx !== -1) {
      subs.splice(idx, 1);
      if (subs.length === 0) this.subscribers.delete(topic);
    }
  }

  topics(): string[] {
    return Array.from(this.subscribers.keys());
  }

  close(): void {
    this.closed = true;
    this.subscribers.clear();
  }

  newStreamEvent(
    topic: string,
    eventType: StreamEventType,
    tenantId: string,
    payload: Record<string, unknown>,
  ): StreamEvent {
    return {
      id: uuid(),
      topic,
      type: eventType,
      payload,
      timestamp: new Date(),
      tenantId,
    };
  }
}
