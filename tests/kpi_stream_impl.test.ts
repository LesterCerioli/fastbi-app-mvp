import { jest } from "@jest/globals";

import { KPIStreamServiceImpl } from "../src/services/streaming/kpi_stream_impl";
import { EventBusImpl, Topic, EventType } from "../src/services/streaming/event_bus_impl";

jest.mock("../src/services/streaming/event_bus_impl");

describe("KPIStreamServiceImpl", () => {
  let service: KPIStreamServiceImpl;
  let mockEventBus: jest.Mocked<EventBusImpl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus = new EventBusImpl() as jest.Mocked<EventBusImpl>;
    mockEventBus.newStreamEvent = jest.fn();
    mockEventBus.publish = jest.fn();
    service = new KPIStreamServiceImpl(mockEventBus);
  });

  describe("publishKPICreated", () => {
    it("publishes KPI created event with merged payload", () => {
      const mockEvent = { id: "evt-1", topic: "kpi", type: "kpi.created", payload: { id: "kpi-1", name: "Test" }, timestamp: new Date(), tenantId: "tenant-1" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPICreated("tenant-1", "kpi-1", { name: "Test" });

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPICreated, "tenant-1", { name: "Test", id: "kpi-1" });
      expect(mockEventBus.publish).toHaveBeenCalledWith(Topic.KPI, mockEvent);
    });

    it("publishes with empty payload", () => {
      const mockEvent = { id: "evt-2", topic: "kpi", type: "kpi.created", payload: { id: "kpi-2" }, timestamp: new Date(), tenantId: "tenant-2" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPICreated("tenant-2", "kpi-2", {});

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPICreated, "tenant-2", { id: "kpi-2" });
    });

    it("publishes with null payload", () => {
      const mockEvent = { id: "evt-3", topic: "kpi", type: "kpi.created", payload: { id: "kpi-3" }, timestamp: new Date(), tenantId: "tenant-3" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPICreated("tenant-3", "kpi-3", null as any);

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPICreated, "tenant-3", { id: "kpi-3" });
    });

    it("uses correct topic constant", () => {
      const mockEvent = { id: "evt-4", topic: "kpi", type: "kpi.created", payload: { id: "kpi-4" }, timestamp: new Date(), tenantId: "tenant-4" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPICreated("tenant-4", "kpi-4", { key: "val" });

      expect(mockEventBus.publish).toHaveBeenCalledWith(Topic.KPI, expect.any(Object));
    });

    it("handles publish error gracefully", () => {
      const mockEvent = { id: "evt-5", topic: "kpi", type: "kpi.created", payload: { id: "kpi-5" }, timestamp: new Date(), tenantId: "tenant-5" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);
      mockEventBus.publish.mockImplementation(() => { throw new Error("publish error"); });

      expect(() => service.publishKPICreated("tenant-5", "kpi-5", {})).toThrow("publish error");
    });

    it("passes tenantId correctly to event", () => {
      const mockEvent = { id: "evt-6", topic: "kpi", type: "kpi.created", payload: { id: "kpi-6" }, timestamp: new Date(), tenantId: "custom-tenant" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPICreated("custom-tenant", "kpi-6", {});

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(expect.anything(), expect.anything(), "custom-tenant", expect.anything());
    });
  });

  describe("publishKPIUpdated", () => {
    it("publishes KPI updated event with merged payload", () => {
      const mockEvent = { id: "evt-7", topic: "kpi", type: "kpi.updated", payload: { id: "kpi-7", value: 100 }, timestamp: new Date(), tenantId: "tenant-7" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPIUpdated("tenant-7", "kpi-7", { value: 100 });

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPIUpdated, "tenant-7", { value: 100, id: "kpi-7" });
      expect(mockEventBus.publish).toHaveBeenCalledWith(Topic.KPI, mockEvent);
    });

    it("publishes with empty payload", () => {
      const mockEvent = { id: "evt-8", topic: "kpi", type: "kpi.updated", payload: { id: "kpi-8" }, timestamp: new Date(), tenantId: "tenant-8" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPIUpdated("tenant-8", "kpi-8", {});

      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it("overrides id in payload with kpiId parameter", () => {
      const mockEvent = { id: "evt-9", topic: "kpi", type: "kpi.updated", payload: { id: "kpi-9", custom: "data" }, timestamp: new Date(), tenantId: "tenant-9" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPIUpdated("tenant-9", "kpi-9", { id: "should-be-overridden", custom: "data" });

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPIUpdated, "tenant-9", { id: "kpi-9", custom: "data" });
    });

    it("handles publish failure", () => {
      mockEventBus.newStreamEvent.mockReturnValue({} as any);
      mockEventBus.publish.mockImplementation(() => { throw new Error("fail"); });

      expect(() => service.publishKPIUpdated("t", "k", {})).toThrow("fail");
    });
  });

  describe("publishKPIDeleted", () => {
    it("publishes KPI deleted event with id in payload", () => {
      const mockEvent = { id: "evt-10", topic: "kpi", type: "kpi.deleted", payload: { id: "kpi-10" }, timestamp: new Date(), tenantId: "tenant-10" };
      mockEventBus.newStreamEvent.mockReturnValue(mockEvent);

      service.publishKPIDeleted("tenant-10", "kpi-10");

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPIDeleted, "tenant-10", { id: "kpi-10" });
      expect(mockEventBus.publish).toHaveBeenCalledWith(Topic.KPI, mockEvent);
    });

    it("uses correct EventType constant", () => {
      mockEventBus.newStreamEvent.mockReturnValue({} as any);

      service.publishKPIDeleted("t", "k");

      expect(mockEventBus.newStreamEvent).toHaveBeenCalledWith(Topic.KPI, EventType.KPIDeleted, expect.any(String), expect.any(Object));
    });

    it("handles publish error gracefully", () => {
      mockEventBus.newStreamEvent.mockReturnValue({} as any);
      mockEventBus.publish.mockImplementation(() => { throw new Error("fail"); });

      expect(() => service.publishKPIDeleted("t", "k")).toThrow("fail");
    });
  });

  describe("start and stop", () => {
    it("start does not throw", () => {
      expect(() => service.start()).not.toThrow();
    });

    it("stop sets stopCh and closes listener", () => {
      const mockListener = { close: jest.fn() };
      (service as any).listener = mockListener;

      service.stop();

      expect((service as any).stopCh).toBe(true);
      expect(mockListener.close).toHaveBeenCalled();
      expect((service as any).listener).toBeNull();
    });

    it("stop is safe when listener is null", () => {
      expect(() => service.stop()).not.toThrow();
    });
  });
});
