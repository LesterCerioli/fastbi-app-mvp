import { jest } from "@jest/globals";

jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));
jest.mock("../src/services/streaming/event_bus_impl", () => ({
  EventBusImpl: jest.fn().mockImplementation(() => ({
    newStreamEvent: jest.fn(),
    publish: jest.fn(),
  })),
}));
jest.mock("../src/services/streaming/rabbitmq_impl", () => ({
  RabbitMQBroker: jest.fn().mockImplementation(() => ({
    publish: jest.fn(),
    subscribe: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn(),
  })),
}));

import { DistributedCoordinatorImpl } from "../src/services/streaming/distributed_coordinator_impl";
import { EventBusImpl } from "../src/services/streaming/event_bus_impl";
import { RabbitMQBroker } from "../src/services/streaming/rabbitmq_impl";

describe("DistributedCoordinatorImpl", () => {
  let broker: jest.Mocked<RabbitMQBroker>;
  let eventBus: jest.Mocked<EventBusImpl>;
  let coordinator: DistributedCoordinatorImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    (RabbitMQBroker as jest.Mock).mockImplementation(() => ({
      publish: jest.fn(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
    }));
    (EventBusImpl as jest.Mock).mockImplementation(() => ({
      newStreamEvent: jest.fn().mockReturnValue({ id: "evt-1", topic: "fastbi.analytics", type: "analytics.task", payload: {}, timestamp: new Date(), tenantId: "org-1" }),
      publish: jest.fn(),
    }));
    broker = new (RabbitMQBroker as any)() as jest.Mocked<RabbitMQBroker>;
    eventBus = new (EventBusImpl as any)() as jest.Mocked<EventBusImpl>;
    coordinator = new DistributedCoordinatorImpl(broker, eventBus);
  });

  describe("constructor", () => {
    it("starts result consumer when broker is connected", () => {
      expect(broker.isConnected).toHaveBeenCalled();
      expect(broker.subscribe).toHaveBeenCalled();
    });

    it("skips consumer when broker is not connected", () => {
      jest.clearAllMocks();
      (RabbitMQBroker as jest.Mock).mockImplementation(() => ({
        publish: jest.fn(),
        subscribe: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(false),
      }));
      broker = new (RabbitMQBroker as any)() as jest.Mocked<RabbitMQBroker>;
      eventBus = new (EventBusImpl as any)() as jest.Mocked<EventBusImpl>;
      coordinator = new DistributedCoordinatorImpl(broker, eventBus);
      expect(broker.subscribe).not.toHaveBeenCalled();
    });
  });

  describe("submitTask", () => {
    it("submits a task and publishes to broker", async () => {
      const taskId = await coordinator.submitTask("org-1", "analysis", { period: "month" });
      expect(taskId).toBeDefined();
      expect(eventBus.newStreamEvent).toHaveBeenCalled();
      expect(broker.publish).toHaveBeenCalled();
    });

    it("submits task with empty params", async () => {
      const taskId = await coordinator.submitTask("org-1", "report", {});
      expect(taskId).toBeDefined();
      expect(eventBus.newStreamEvent).toHaveBeenCalled();
    });
  });
});
