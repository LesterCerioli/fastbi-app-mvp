import { jest } from "@jest/globals";
import { EventBusImpl, Topic, StreamEvent } from "../src/services/streaming/event_bus_impl";
import { SSEManagerImpl } from "../src/services/streaming/sse_manager_impl";

describe("SSEManagerImpl - positive scenarios", () => {
  it("creates a stream with custom topics", () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(() => {});
    const manager = new SSEManagerImpl(eventBus);
    const stream = manager.createStream(["kpi"]);
    expect(manager.activeConnections()).toBe(1);
    expect(typeof stream.channel).toBe("function");
    expect(typeof stream.cancel).toBe("function");
  });

  it("creates a stream with empty topics defaults to All", () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(() => {});
    const manager = new SSEManagerImpl(eventBus);
    manager.createStream([]);
    expect(manager.activeConnections()).toBe(1);
  });

  it("cancels a stream and decrements active count", () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(() => {});
    const manager = new SSEManagerImpl(eventBus);
    const stream = manager.createStream(["kpi"]);
    stream.cancel();
    expect(manager.activeConnections()).toBe(0);
  });

  it("channel handler delivers events to subscribers", () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(() => {});
    const manager = new SSEManagerImpl(eventBus);
    const stream = manager.createStream(["kpi"]);
    const handler = jest.fn();
    const mockEvent = { id: "evt-1", topic: "kpi", type: "kpi.created", payload: {}, timestamp: new Date(), tenantId: "org-1" } as StreamEvent;
    stream.channel(mockEvent);
    expect(handler).not.toThrow;
  });
});

describe("SSEManagerImpl - negative scenarios", () => {
  it("starts with 0 active connections", () => {
    const manager = new SSEManagerImpl(new EventBusImpl());
    expect(manager.activeConnections()).toBe(0);
  });

  it("unsubscribes all topics on cancel", () => {
    const eventBus = new EventBusImpl();
    const unsubscribe = jest.fn();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(unsubscribe);
    const manager = new SSEManagerImpl(eventBus);
    const stream = manager.createStream(["kpi", "report"]);
    stream.cancel();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it("handles multiple streams independently", () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(() => {});
    const manager = new SSEManagerImpl(eventBus);
    const s1 = manager.createStream(["kpi"]);
    const s2 = manager.createStream(["report"]);
    expect(manager.activeConnections()).toBe(2);
    s1.cancel();
    expect(manager.activeConnections()).toBe(1);
    s2.cancel();
    expect(manager.activeConnections()).toBe(0);
  });

  it("does not throw when cancelling an already-cancelled stream", () => {
    const eventBus = new EventBusImpl();
    jest.spyOn(eventBus, "subscribe").mockReturnValue({ channel: jest.fn(), id: "sub-1" });
    jest.spyOn(eventBus, "unsubscribe").mockImplementation(() => {});
    const manager = new SSEManagerImpl(eventBus);
    const stream = manager.createStream(["kpi"]);
    stream.cancel();
    expect(() => stream.cancel()).not.toThrow();
  });
});
