import { jest } from "@jest/globals";

jest.mock("uuid", () => ({ v4: jest.fn(() => "mock-uuid") }));

import { EventBusImpl, EventType, Topic, StreamEvent } from "../src/services/streaming/event_bus_impl";

describe("EventBusImpl", () => {
  let bus: EventBusImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    bus = new EventBusImpl();
  });

  describe("subscribe and publish", () => {
    it("subscribe adds subscriber and returns id and channel", () => {
      const sub = bus.subscribe("kpi");
      expect(sub.id).toBe("mock-uuid");
      expect(typeof sub.channel).toBe("function");
      expect(bus.topics()).toContain("kpi");
    });

    it("publish does not throw when no subscribers", () => {
      const event: StreamEvent = { id: "e1", topic: "kpi", type: EventType.KPICreated, payload: {}, timestamp: new Date(), tenantId: "org-1" };
      expect(() => bus.publish("kpi", event)).not.toThrow();
    });

    it("publish does not throw after close", () => {
      bus.close();
      const event: StreamEvent = { id: "e1", topic: "kpi", type: EventType.KPICreated, payload: {}, timestamp: new Date(), tenantId: "org-1" };
      expect(() => bus.publish("kpi", event)).not.toThrow();
    });

    it("subscribing to multiple topics adds them all", () => {
      bus.subscribe("kpi");
      bus.subscribe("anomaly");
      const topics = bus.topics();
      expect(topics).toContain("kpi");
      expect(topics).toContain("anomaly");
    });
  });

  describe("unsubscribe", () => {
    it("removes subscriber from topic", () => {
      const sub = bus.subscribe("kpi");
      bus.unsubscribe("kpi", sub.id);
      expect(bus.topics()).not.toContain("kpi");
    });

    it("does nothing when topic does not exist", () => {
      expect(() => bus.unsubscribe("nonexistent", "some-id")).not.toThrow();
    });

    it("does nothing when subscriber id is not found", () => {
      bus.subscribe("kpi");
      expect(() => bus.unsubscribe("kpi", "wrong-id")).not.toThrow();
      expect(bus.topics()).toContain("kpi");
    });
  });

  describe("topics", () => {
    it("lists active topics", () => {
      bus.subscribe("kpi");
      bus.subscribe("anomaly");
      const topics = bus.topics();
      expect(topics).toContain("kpi");
      expect(topics).toContain("anomaly");
    });

    it("returns empty array when no subscribers", () => {
      expect(bus.topics()).toEqual([]);
    });

    it("removes topic from list after last subscriber unsubscribes", () => {
      const sub = bus.subscribe("kpi");
      bus.unsubscribe("kpi", sub.id);
      expect(bus.topics()).toEqual([]);
    });
  });

  describe("close", () => {
    it("clears all subscribers", () => {
      bus.subscribe("kpi");
      bus.subscribe("anomaly");
      bus.close();
      expect(bus.topics()).toEqual([]);
    });

    it("stops publishing events (no throw)", () => {
      bus.subscribe("kpi");
      bus.close();
      const event: StreamEvent = { id: "e1", topic: "kpi", type: EventType.KPICreated, payload: {}, timestamp: new Date(), tenantId: "o1" };
      expect(() => bus.publish("kpi", event)).not.toThrow();
    });
  });

  describe("newStreamEvent", () => {
    it("creates a stream event with uuid", () => {
      const evt = bus.newStreamEvent("kpi", EventType.KPICreated, "org-1", { value: 100 });
      expect(evt.id).toBe("mock-uuid");
      expect(evt.topic).toBe("kpi");
      expect(evt.type).toBe(EventType.KPICreated);
      expect(evt.tenantId).toBe("org-1");
    });

    it("creates event with current timestamp", () => {
      const before = new Date();
      const evt = bus.newStreamEvent("t", EventType.MetricTick, "o1", {});
      const after = new Date();
      expect(evt.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(evt.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
