import { EventBusImpl } from "./event_bus_impl";
import { RabbitMQBroker } from "./rabbitmq_impl";

export interface AnalyticsTask {
  taskId: string;
  organizationId: string;
  taskType: string;
  parameters: Record<string, unknown>;
  submittedAt: Date;
}

const ANALYTICS_EXCHANGE = "fastbi.analytics";
const ANALYTICS_QUEUE = "fastbi.analytics.tasks";
const RESULTS_QUEUE = "fastbi.analytics.results";

export class DistributedCoordinatorImpl {
  constructor(
    private broker: RabbitMQBroker,
    private eventBus: EventBusImpl,
  ) {
    this.startResultConsumer();
  }

  async submitTask(
    orgId: string,
    taskType: string,
    params: Record<string, unknown>,
  ): Promise<string> {
    const { v4: uuid } = await import("uuid");
    const taskId = uuid();

    const task: AnalyticsTask = {
      taskId,
      organizationId: orgId,
      taskType,
      parameters: params,
      submittedAt: new Date(),
    };

    const event = this.eventBus.newStreamEvent(
      ANALYTICS_EXCHANGE,
      "analytics.task" as any,
      orgId,
      { raw: JSON.stringify(task) },
    );

    await this.broker.publish(ANALYTICS_EXCHANGE, ANALYTICS_QUEUE, event);

    console.log(
      `DistributedCoordinator: task ${taskId} submitted for org ${orgId} (type: ${taskType})`,
    );
    return taskId;
  }

  private startResultConsumer(): void {
    if (!this.broker.isConnected()) {
      console.log(
        "DistributedCoordinator: broker not connected, result consumer skipped",
      );
      return;
    }

    this.broker
      .subscribe(RESULTS_QUEUE, (event) => {
        console.log(
          `DistributedCoordinator: result received for task ${event.id}`,
        );
        this.eventBus.publish(event.topic, event);
      })
      .catch((err) => {
        console.log(
          `DistributedCoordinator: result consumer failed: ${err}`,
        );
      });
  }
}
