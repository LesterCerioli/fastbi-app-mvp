import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn() }));
jest.mock("../src/services/ai/anomaly_detector", () => ({
  AnomalyDetector: jest.fn().mockImplementation(() => ({
    detectZScore: jest.fn(),
  })),
}));
jest.mock("../src/services/streaming/event_bus_impl", () => ({
  EventBusImpl: jest.fn().mockImplementation(() => ({
    newStreamEvent: jest.fn(),
    publish: jest.fn(),
  })),
  Topic: { Anomaly: "anomaly" },
  EventType: { AnomalyDetected: "anomaly.detected" },
}));

import { query } from "../src/services/db";
import { AnomalyDetector } from "../src/services/ai/anomaly_detector";
import { EventBusImpl } from "../src/services/streaming/event_bus_impl";
import { AnomalyStreamServiceImpl } from "../src/services/streaming/anomaly_stream_impl";

const mockQuery = query as jest.Mock;

describe("AnomalyStreamServiceImpl", () => {
  let service: AnomalyStreamServiceImpl;
  let mockEventBus: jest.Mocked<EventBusImpl>;
  let mockDetector: jest.Mocked<AnomalyDetector>;
  let mockPublish: jest.Mock;
  let mockNewStreamEvent: jest.Mock;
  let mockDetectZScore: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPublish = jest.fn();
    mockNewStreamEvent = jest.fn().mockReturnValue({
      id: "evt1", topic: "anomaly", type: "anomaly.detected",
      tenantId: "tenant1", payload: {},
      timestamp: new Date(),
    });
    mockDetectZScore = jest.fn();

    (EventBusImpl as jest.Mock).mockImplementation(() => ({
      publish: mockPublish,
      newStreamEvent: mockNewStreamEvent,
    }));
    (AnomalyDetector as jest.Mock).mockImplementation(() => ({
      detectZScore: mockDetectZScore,
    }));

    service = new AnomalyStreamServiceImpl(
      new EventBusImpl(),
      new AnomalyDetector()
    );
  });

  describe("resolveOrganizationID", () => {
    it("resolves org id from name", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      const result = await service.resolveOrganizationID("MyOrg");
      expect(result).toBe("org1");
    });

    it("throws when org name empty", async () => {
      await expect(service.resolveOrganizationID("")).rejects.toThrow(
        "organization_name is required"
      );
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      await expect(service.resolveOrganizationID("Unknown")).rejects.toThrow(
        "organization not found"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      await expect(service.resolveOrganizationID("Org")).rejects.toThrow("db error");
    });
  });

  describe("publishAnomaly", () => {
    it("publishes anomaly event", () => {
      service.publishAnomaly("tenant1", "cpu_usage", 95, 50, 3.5);
      expect(mockNewStreamEvent).toHaveBeenCalledWith(
        "anomaly", "anomaly.detected", "tenant1",
        expect.objectContaining({ metric: "cpu_usage", value: 95 })
      );
      expect(mockPublish).toHaveBeenCalledWith("anomaly", expect.any(Object));
    });

    it("includes expected value and z-score in payload", () => {
      service.publishAnomaly("t1", "mem", 1024, 512, 4.2);
      const payload = mockNewStreamEvent.mock.calls[0][3];
      expect(payload.expected_value).toBe(512);
      expect(payload.z_score).toBe(4.2);
    });

    it("handles zero values", () => {
      service.publishAnomaly("t1", "metric", 0, 0, 0);
      expect(mockPublish).toHaveBeenCalled();
    });

    it("handles negative z-score", () => {
      service.publishAnomaly("t1", "m1", 10, 20, -2.5);
      expect(mockPublish).toHaveBeenCalled();
    });
  });

  describe("runScan", () => {
    it("publishes anomalies when detected", () => {
      mockDetectZScore.mockReturnValue([
        { index: 0, value: 100, expectedValue: 50, zScore: 3.5, isAnomaly: true },
      ]);
      service.runScan("t1", [10, 20, 100, 30], 2.5);
      expect(mockPublish).toHaveBeenCalled();
    });

    it("does not publish when no anomalies", () => {
      mockDetectZScore.mockReturnValue([
        { index: 0, value: 10, expectedValue: 12, zScore: 1.0, isAnomaly: false },
      ]);
      service.runScan("t1", [10, 11, 12], 2.5);
      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("publishes for each anomaly detected", () => {
      mockDetectZScore.mockReturnValue([
        { index: 0, value: 100, expectedValue: 30, zScore: 4.0, isAnomaly: true },
        { index: 1, value: 200, expectedValue: 30, zScore: 6.0, isAnomaly: true },
      ]);
      service.runScan("t1", [100, 200, 30, 30], 2.5);
      expect(mockPublish).toHaveBeenCalledTimes(2);
    });

    it("throws when values array is empty", () => {
      expect(() => service.runScan("t1", [], 2.5)).rejects.toThrow("values array is empty");
    });

    it("defaults threshold to 2.5 when <= 0", () => {
      mockDetectZScore.mockReturnValue([]);
      service.runScan("t1", [10, 20, 30], 0);
      expect(mockDetectZScore).toHaveBeenCalledWith([10, 20, 30], 2.5);
    });

    it("handles all anomalies", () => {
      mockDetectZScore.mockReturnValue([
        { index: 0, value: 999, expectedValue: 100, zScore: 8.0, isAnomaly: true },
      ]);
      service.runScan("t1", [999, 100, 100], 2);
      expect(mockPublish).toHaveBeenCalled();
    });

    it("passes tenantId correctly in each published event", () => {
      mockDetectZScore.mockReturnValue([
        { index: 0, value: 100, expectedValue: 50, zScore: 3, isAnomaly: true },
      ]);
      service.runScan("tenantX", [10, 20, 100, 30], 2);
      expect(mockNewStreamEvent).toHaveBeenCalledWith(
        "anomaly", "anomaly.detected", "tenantX", expect.any(Object)
      );
    });
  });
});
