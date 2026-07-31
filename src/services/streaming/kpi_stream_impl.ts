import { EventBusImpl, Topic, EventType, StreamEvent } from "./event_bus_impl";

export class KPIStreamServiceImpl {
  private listener: any = null;
  private stopCh = false;

  constructor(
    private eventBus: EventBusImpl,
  ) {}

  start(): void {
    // In a real app this would connect via pg-listen or a LISTEN/NOTIFY client.
    // For now, KPI events are published directly via the publish methods.
  }

  stop(): void {
    this.stopCh = true;
    if (this.listener) {
      this.listener.close();
      this.listener = null;
    }
  }

  publishKPICreated(
    tenantId: string,
    kpiId: string,
    payload: Record<string, unknown>,
  ): void {
    const data = { ...(payload ?? {}), id: kpiId };
    const event = this.eventBus.newStreamEvent(
      Topic.KPI,
      EventType.KPICreated,
      tenantId,
      data,
    );
    this.eventBus.publish(Topic.KPI, event);
  }

  publishKPIUpdated(
    tenantId: string,
    kpiId: string,
    payload: Record<string, unknown>,
  ): void {
    const data = { ...(payload ?? {}), id: kpiId };
    const event = this.eventBus.newStreamEvent(
      Topic.KPI,
      EventType.KPIUpdated,
      tenantId,
      data,
    );
    this.eventBus.publish(Topic.KPI, event);
  }

  publishKPIDeleted(tenantId: string, kpiId: string): void {
    const payload = { id: kpiId };
    const event = this.eventBus.newStreamEvent(
      Topic.KPI,
      EventType.KPIDeleted,
      tenantId,
      payload,
    );
    this.eventBus.publish(Topic.KPI, event);
  }
}
