import { jest } from "@jest/globals";

const mockCreateChannel = jest.fn();
const mockAssertExchange = jest.fn();
const mockAssertQueue = jest.fn();
const mockBindQueue = jest.fn();
const mockPublish = jest.fn();
const mockConsume = jest.fn();
const mockClose = jest.fn();

const mockChannel = {
  assertExchange: mockAssertExchange,
  assertQueue: mockAssertQueue,
  bindQueue: mockBindQueue,
  publish: mockPublish,
  consume: mockConsume,
  close: mockClose,
};

const mockConnect = jest.fn();

jest.mock("amqplib", () => ({
  connect: mockConnect,
}));

import { RabbitMQBroker } from "../src/services/streaming/rabbitmq_impl";
import type { StreamEvent } from "../src/services/streaming/event_bus_impl";

describe("RabbitMQBroker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateChannel.mockResolvedValue(mockChannel);
    mockConnect.mockResolvedValue({
      createChannel: mockCreateChannel,
      close: jest.fn(),
      connection: { on: jest.fn() },
    });
  });

  it("constructor connects and sets up topology when URL is provided", async () => {
    const broker = new RabbitMQBroker("amqp://localhost");

    await new Promise(process.nextTick);

    expect(mockConnect).toHaveBeenCalledWith("amqp://localhost");
    expect(broker.isConnected()).toBe(true);
  });

  it("publish sends event to exchange via channel", async () => {
    const broker = new RabbitMQBroker("amqp://localhost");
    await new Promise(process.nextTick);

    const event: StreamEvent = { id: "e1", type: "metric.tick", source: "test", payload: { value: 42 } };
    await broker.publish("fastbi.reports", "report.job.high", event);

    expect(mockCreateChannel).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledWith(
      "fastbi.reports", "report.job.high",
      expect.any(Buffer),
      expect.objectContaining({ contentType: "application/json" }),
    );
  });

  it("subscribe starts consuming on queue", async () => {
    const broker = new RabbitMQBroker("amqp://localhost");
    await new Promise(process.nextTick);

    const handler = jest.fn();
    await broker.subscribe("fastbi.reports.jobs.high", handler);

    expect(mockConsume).toHaveBeenCalledWith(
      "fastbi.reports.jobs.high",
      expect.any(Function),
      { noAck: true },
    );
  });

  it("close calls model.close when connected", async () => {
    const mockModelClose = jest.fn();
    mockConnect.mockResolvedValue({
      createChannel: mockCreateChannel,
      close: mockModelClose,
      connection: { on: jest.fn() },
    });

    const broker = new RabbitMQBroker("amqp://localhost");
    await new Promise(process.nextTick);

    await broker.close();
    expect(mockModelClose).toHaveBeenCalled();
  });

  it("constructor operates in no-op mode when URL is empty", () => {
    const broker = new RabbitMQBroker("");
    expect(broker.isConnected()).toBe(false);
  });

  it("publish throws when not connected", async () => {
    const broker = new RabbitMQBroker("");
    const event: StreamEvent = { id: "e1", type: "metric.tick", source: "test", payload: {} };

    await expect(broker.publish("exchange", "rk", event)).rejects.toThrow("RabbitMQ not connected");
  });

  it("subscribe throws when not connected", async () => {
    const broker = new RabbitMQBroker("");

    await expect(broker.subscribe("queue", jest.fn())).rejects.toThrow("RabbitMQ not connected");
  });

  it("publish closes channel after sending", async () => {
    const broker = new RabbitMQBroker("amqp://localhost");
    await new Promise(process.nextTick);

    const event: StreamEvent = { id: "e1", type: "metric.tick", source: "test", payload: {} };
    await broker.publish("fastbi.reports", "rk", event);

    expect(mockClose).toHaveBeenCalled();
  });
});
