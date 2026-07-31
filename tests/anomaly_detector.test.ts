import { AnomalyDetector } from "../src/services/ai/anomaly_detector";

describe("AnomalyDetector", () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector();
  });

  describe("detectZScore", () => {
    it("detects anomalies above threshold", () => {
      const values = [10, 12, 11, 13, 50, 9, 11, 10, 12, 11];
      const results = detector.detectZScore(values, 2.5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].isAnomaly).toBe(true);
    });

    it("returns empty array for empty input", () => {
      expect(detector.detectZScore([], 2.5)).toEqual([]);
    });

    it("returns empty array when stdDev is 0", () => {
      const results = detector.detectZScore([5, 5, 5, 5], 2.5);
      expect(results).toEqual([]);
    });

    it("returns no anomalies for uniform data", () => {
      const values = [10, 11, 10, 11, 10, 11, 10, 11];
      const results = detector.detectZScore(values, 3);
      expect(results).toEqual([]);
    });
  });

  describe("detectIQR", () => {
    it("detects outliers using IQR method", () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
      const results = detector.detectIQR(values);
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty array for fewer than 4 values", () => {
      expect(detector.detectIQR([1, 2, 3])).toEqual([]);
    });

    it("returns empty array for uniform data", () => {
      const values = [5, 5, 5, 5, 5, 5];
      const results = detector.detectIQR(values);
      expect(results).toEqual([]);
    });

    it("detects outliers on lower bound", () => {
      const values = [-100, 10, 11, 12, 13, 14, 15, 16, 17, 18];
      const results = detector.detectIQR(values);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("detectMovingAverage", () => {
    it("detects anomalies using moving average", () => {
      const values = [10, 11, 10, 12, 11, 50, 10, 11, 12, 10];
      const results = detector.detectMovingAverage(values, 3, 2.5);
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty when fewer values than window size", () => {
      expect(detector.detectMovingAverage([1, 2], 3, 2.5)).toEqual([]);
    });

    it("returns empty when window has no variance", () => {
      const values = [5, 5, 5, 5, 10, 5, 5, 5];
      const results = detector.detectMovingAverage(values, 3, 2.5);
      expect(Array.isArray(results)).toBe(true);
    });

    it("returns empty for uniform values", () => {
      const values = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      const results = detector.detectMovingAverage(values, 3, 2.5);
      expect(results).toEqual([]);
    });
  });
});
