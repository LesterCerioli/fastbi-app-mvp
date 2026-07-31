import { EventBusImpl, Topic, StreamEvent } from "./event_bus_impl";

export class SSEManagerImpl {
  private activeCount = 0;

  constructor(private eventBus: EventBusImpl) {}

  createStream(
    topics: string[],
  ): { channel: (event: StreamEvent) => void; cancel: () => void } {
    if (topics.length === 0) {
      topics = [Topic.All];
    }

    this.activeCount++;

    const handlers: ((event: StreamEvent) => void)[] = [];
    const subscriptions: { topic: string; id: string }[] = [];

    for (const topic of topics) {
      const { channel, id } = this.eventBus.subscribe(topic);
      subscriptions.push({ topic, id });

      const handler = (event: StreamEvent) => {
        for (const h of handlers) h(event);
      };
      handlers.push(handler);
    }

    const cancel = () => {
      this.activeCount--;
      for (const sub of subscriptions) {
        this.eventBus.unsubscribe(sub.topic, sub.id);
      }
    };

    return {
      channel: (event: StreamEvent) => {
        for (const h of handlers) h(event);
      },
      cancel,
    };
  }

  activeConnections(): number {
    return this.activeCount;
  }
}
