import { DataVerifier, RawClaim } from "../src/services/reports/report_narrative/data_verifier";

describe("DataVerifier", () => {
  let verifier: DataVerifier;

  beforeEach(() => {
    verifier = new DataVerifier();
  });

  describe("verify", () => {
    it("returns verified claims when sourceRef matches exactly within tolerance", () => {
      const claims: RawClaim[] = [
        { text: "100", value: 100, sourceRef: "revenue" },
      ];
      const [result, score] = verifier.verify(claims, { revenue: 100 });
      expect(result[0].verified).toBe(true);
      expect(result[0].confidence).toBe(1.0);
      expect(score).toBe(1.0);
    });

    it("returns empty result for empty claims", () => {
      const [result, score] = verifier.verify([], { revenue: 100 });
      expect(result).toEqual([]);
      expect(score).toBe(1.0);
    });

    it("marks claim as unverified when value exceeds tolerance", () => {
      const claims: RawClaim[] = [
        { text: "200", value: 200, sourceRef: "revenue" },
      ];
      const [result, score] = verifier.verify(claims, { revenue: 100 });
      expect(result[0].verified).toBe(false);
      expect(result[0].confidence).toBeLessThan(1.0);
      expect(score).toBe(0);
    });

    it("assigns partial confidence when sourceRef is missing", () => {
      const claims: RawClaim[] = [
        { text: "150", value: 150, sourceRef: "unknown" },
      ];
      const [result, score] = verifier.verify(claims, { revenue: 100 });
      expect(result[0].confidence).toBeGreaterThan(0);
      expect(result[0].confidence).toBeLessThan(0.95);
      expect(result[0].verified).toBe(false);
    });

    it("handles multiple claims with mixed results", () => {
      const claims: RawClaim[] = [
        { text: "100", value: 100, sourceRef: "revenue" },
        { text: "500", value: 500, sourceRef: "costs" },
      ];
      const [result, score] = verifier.verify(claims, { revenue: 100, costs: 600 });
      expect(result[0].verified).toBe(true);
      expect(result[1].verified).toBe(false);
      expect(score).toBe(0.5);
    });

    it("handles zero values correctly", () => {
      const claims: RawClaim[] = [
        { text: "0", value: 0, sourceRef: "zero" },
      ];
      const [result, score] = verifier.verify(claims, { zero: 0 });
      expect(result[0].verified).toBe(true);
      expect(score).toBe(1.0);
    });

    it("treats division by zero safely when b is 0", () => {
      const claims: RawClaim[] = [
        { text: "5", value: 5, sourceRef: "zero" },
      ];
      const [result] = verifier.verify(claims, { zero: 0 });
      expect(result[0].verified).toBe(false);
    });

    it("finds closest match when sourceRef is missing but value is close", () => {
      const claims: RawClaim[] = [
        { text: "106", value: 106, sourceRef: "nope" },
      ];
      const [result, score] = verifier.verify(claims, { revenue: 100 });
      expect(result[0].confidence).toBeGreaterThan(0.9);
      expect(result[0].confidence).toBeLessThan(0.95);
      expect(result[0].verified).toBe(false);
    });
  });

  describe("extractNumericClaims", () => {
    it("extracts numbers from text with matching source ref", () => {
      const claims = verifier.extractNumericClaims("revenue was 100 dollars", "someRef", { revenue: 100 });
      expect(claims.length).toBeGreaterThan(0);
    });

    it("returns empty array when no numbers in text", () => {
      const claims = verifier.extractNumericClaims("no digits here", "ref", { x: 1 });
      expect(claims).toEqual([]);
    });

    it("skips zero values", () => {
      const claims = verifier.extractNumericClaims("value is 0 and 5", "ref", { x: 10 });
      const vals = claims.map((c) => c.value);
      expect(vals.includes(0)).toBe(false);
    });

    it("deduplicates identical values", () => {
      const claims = verifier.extractNumericClaims("score 100 and also 100", "ref", { x: 100 });
      expect(claims.length).toBe(1);
    });
  });
});
