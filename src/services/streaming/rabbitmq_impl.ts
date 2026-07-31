import amqp from "amqplib";
import type { ChannelModel, Channel, ConsumeMessage, Connection as AmqpConnection } from "amqplib";
import { StreamEvent } from "./event_bus_impl";

export class RabbitMQBroker {
  private url: string;
  private model: ChannelModel | null = null;
  private connected = false;

  constructor(amqpURL: string) {
    this.url = amqpURL;
    if (!amqpURL) {
      console.log("RabbitMQ: no URL configured, broker operating in no-op mode");
      return;
    }
    this.dial().catch((err) => {
      console.log(`RabbitMQ: initial connection failed (will retry): ${err}`);
      this.reconnectLoop();
    });
  }

  private async dial(): Promise<void> {
    this.model = await amqp.connect(this.url);
    this.connected = true;
    console.log("RabbitMQ: connected");

    await this.setupTopology();

    ;(this.model.connection as any).on("close", () => {
      this.connected = false;
      console.log("RabbitMQ: connection lost, reconnecting…");
      this.reconnectLoop();
    });
  }

  private async setupTopology(): Promise<void> {
    if (!this.model) return;
    const ch: Channel = await this.model.createChannel();

    await ch.assertExchange("fastbi.reports", "topic", { durable: true });

    const topology = [
      { queue: "fastbi.reports.jobs.high", routingKey: "report.job.high" },
      { queue: "fastbi.reports.jobs.normal", routingKey: "report.job.normal" },
      { queue: "fastbi.reports.dlq", routingKey: "report.job.dead_lettered" },
    ];

    for (const t of topology) {
      await ch.assertQueue(t.queue, { durable: true });
      await ch.bindQueue(t.queue, "fastbi.reports", t.routingKey);
    }

    await ch.close();
    console.log("RabbitMQ: topology ready (exchange=fastbi.reports, queues=3)");
  }

  private async reconnectLoop(): Promise<void> {
    while (!this.connected) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        await this.dial();
        return;
      } catch {
        // retry
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publish(
    exchange: string,
    routingKey: string,
    event: StreamEvent,
  ): Promise<void> {
    if (!this.connected || !this.model) throw new Error("RabbitMQ not connected");

    const ch: Channel = await this.model.createChannel();
    try {
      const body = Buffer.from(JSON.stringify(event));
      ch.publish(exchange, routingKey, body, {
        contentType: "application/json",
        deliveryMode: 2,
        timestamp: Date.now(),
      });
    } finally {
      await ch.close();
    }
  }

  async subscribe(
    queue: string,
    handler: (event: StreamEvent) => void,
  ): Promise<void> {
    if (!this.connected || !this.model) throw new Error("RabbitMQ not connected");

    const ch: Channel = await this.model.createChannel();
    await ch.consume(
      queue,
      (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const event: StreamEvent = JSON.parse(msg.content.toString());
          handler(event);
        } catch (err) {
          console.log(
            `RabbitMQ: failed to decode message from ${queue}: ${err}`,
          );
        }
      },
      { noAck: true },
    );

    console.log(`RabbitMQ: consuming queue=${queue}`);
  }

  async close(): Promise<void> {
    if (this.model) {
      await this.model.close();
    }
  }
}
