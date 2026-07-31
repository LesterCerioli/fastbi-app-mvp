import { jest } from "@jest/globals";

import { MetricsCollectorImpl, type MetricsSnapshot } from "../src/services/streaming/metrics_collector_impl";
import { EventBusImpl, Topic, EventType } from "../src/services/streaming/event_bus_impl";

jest.mock("../src/services/streaming/event_bus_impl");

describe("MetricsCollectorImpl", () => {
  let collector: MetricsCollectorImpl;
  let mockEventBus: jest.Mocked<EventBusImpl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus = new EventBusImpl() as jest.Mocked<EventBusImpl>;
    mockEventBus.newStreamEvent = jest.fn();
    mockEventBus.publish = jest.fn();
    collector = new MetricsCollectorImpl(mockEventBus);
  });

  describe("recordRequest", () => {
    it("stores a request point in the ring buffer", () => {
      collector.recordRequest("GET", "/api/test", 200, 50);

      const points = (collector as any).points;
      const head = (collector as any).head;
      expect(points[head - 1]).toBeDefined();
      expect(points[head - 1].method).toBe("GET");
    });

    it("increments count up to ring size", () => {
      for (let i = 0; i < 500; i++) {
        collector.recordRequest("GET", "/api/test", 200, i);
      }

      expect((collector as any).count).toBe(500);
    });

    it("wraps around when exceeding ring size", () => {
      for (let i = 0; i < 15000; i++) {
        collector.recordRequest("GET", "/api/test", 200, i);
      }

      expect((collector as any).count).toBe(10000);
      expect((collector as any).head).toBe(5000);
    });

    it("stores latency values correctly", () => {
      collector.recordRequest("POST", "/api/data", 201, 150);

      const point = (collector as any).points[(collector as any).head - 1];
      expect(point.latencyMs).toBe(150);
      expect(point.statusCode).toBe(201);
    });

    it("handles rapid sequential calls", () => {
      for (let i = 0; i < 100; i++) {
        collector.recordRequest("GET", "/path", 200, i);
      }

      const snap = collector.snapshot();
      expect(snap.requestsPerMinute).toBe(100);
    });

    it("does not throw with empty initial state", () => {
      expect(() => collector.recordRequest("GET", "/", 200, 0)).not.toThrow();
    });
  });

  describe("setActiveConnections", () => {
    it("sets the active connections count", () => {
      collector.setActiveConnections(42);

      expect((collector as any).activeConnections).toBe(42);
    });

    it("snapshot reflects active connections", () => {
      collector.setActiveConnections(10);
      collector.recordRequest("GET", "/", 200, 5);

      const snap = collector.snapshot();
      expect(snap.activeConnections).toBe(10);
    });

    it("accepts zero connections", () => {
      collector.setActiveConnections(0);

      const snap = collector.snapshot();
      expect(snap.activeConnections).toBe(0);
    });
  });

  describe("snapshot", () => {
    it("returns zero values when no data recorded", () => {
      const snap = collector.snapshot();

      expect(snap.requestsPerMinute).toBe(0);
      expect(snap.errorRate).toBe(0);
      expect(snap.topPaths).toHaveLength(0);
    });

    it("calculates latency percentiles correctly", () => {
      for (let i = 1; i <= 100; i++) {
        collector.recordRequest("GET", "/api/test", 200, i);
      }

      const snap = collector.snapshot();

      expect(snap.p50LatencyMs).toBe(50);
      expect(snap.p95LatencyMs).toBe(95);
      expect(snap.p99LatencyMs).toBe(99);
    });

    it("calculates error rate from 5xx status codes", () => {
      for (let i = 0; i < 80; i++) collector.recordRequest("GET", "/ok", 200, 10);
      for (let i = 0; i < 20; i++) collector.recordRequest("GET", "/err", 500, 10);

      const snap = collector.snapshot();

      expect(snap.errorRate).toBe(20);
    });

    it("tracks status code distribution", () => {
      collector.recordRequest("GET", "/a", 200, 5);
      collector.recordRequest("GET", "/b", 404, 5);
      collector.recordRequest("GET", "/c", 500, 5);

      const snap = collector.snapshot();

      expect(snap.statusCodes["200"]).toBe(1);
      expect(snap.statusCodes["404"]).toBe(1);
      expect(snap.statusCodes["500"]).toBe(1);
    });

    it("returns top 5 paths sorted by count", () => {
      for (let i = 0; i < 100; i++) collector.recordRequest("GET", "/popular", 200, 10);
      for (let i = 0; i < 30; i++) collector.recordRequest("GET", "/medium", 200, 20);
      for (let i = 0; i < 10; i++) collector.recordRequest("GET", "/rare", 200, 30);

      const snap = collector.snapshot();

      expect(snap.topPaths[0].path).toBe("/popular");
      expect(snap.topPaths[0].count).toBe(100);
    });

    it("excludes points older than 60 seconds", async () => {
      const oldPoint = { timestamp: new Date(Date.now() - 120_000), method: "GET", path: "/old", statusCode: 200, latencyMs: 5 };
      (collector as any).points[0] = oldPoint;
      (collector as any).head = 1;
      (collector as any).count = 1;

      const snap = collector.snapshot();

      expect(snap.requestsPerMinute).toBe(0);
    });

    it("handles no points within 60 second window", () => {
      const snap = collector.snapshot();
      expect(snap.requestsPerMinute).toBe(0);
    });

    it("handles single data point correctly", () => {
      collector.recordRequest("GET", "/single", 200, 42);

      const snap = collector.snapshot();

      expect(snap.p50LatencyMs).toBe(42);
      expect(snap.requestsPerMinute).toBe(1);
    });

    it("includes average latency per path", () => {
      collector.recordRequest("GET", "/path", 200, 10);
      collector.recordRequest("GET", "/path", 200, 30);

      const snap = collector.snapshot();

      expect(snap.topPaths[0].avgMs).toBe(20);
    });
  });

  describe("startTicker and stopTicker", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("publishes metrics events on interval", () => {
      const mockEvent = { id: "evt-1", topic: "metrics", type: "metric.tick", payload: {}, timestamp: new Date(), tenantId: "" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      collector.startTicker(0.01);
      jest.advanceTimersByTime(20);

      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it("uses default interval of 5 seconds when interval is 0 or negative", () => {
      collector.startTicker(0);

      expect((collector as any).tickerHandle).not.toBeNull();
    });

    it("publishes event with correct topic and type", () => {
      const mockEvent = { id: "evt-2", topic: "metrics", type: "metric.tick", payload: {}, timestamp: new Date(), tenantId: "" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      collector.startTicker(0.01);
      jest.advanceTimersByTime(20);

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.Metrics, EventType.MetricTick, "", expect.any(Object));
    });

    it("stopTicker clears interval and nulls handle", () => {
      collector.startTicker(0.01);
      collector.stopTicker();

      expect((collector as any).tickerHandle).toBeNull();
    });

    it("stopTicker is safe when no ticker active", () => {
      expect(() => collector.stopTicker()).not.toThrow();
    });

    it("includes snapshot data in published payload", () => {
      collector.recordRequest("GET", "/api", 200, 10);
      const mockEvent = { id: "evt-3", topic: "metrics", type: "metric.tick", payload: {}, timestamp: new Date(), tenantId: "" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      collector.startTicker(0.01);
      jest.advanceTimersByTime(20);

      const payload = mockEventBus.newStreamEvent.mock.calls[0][3];
      expect(payload).toHaveProperty("requests_per_minute");
      expect(payload).toHaveProperty("p50_latency_ms");
    });

    it("does not throw on publish error in ticker", () => {
      mockEventBus.newStreamEvent.mockReturnValue({} as any);
      mockEventBus.publish.mockImplementation(() => { throw new Error("publish err"); });

      expect(() => {
        collector.startTicker(0.01);
        jest.advanceTimersByTime(20);
      }).not.toThrow();
    });
  });
});
