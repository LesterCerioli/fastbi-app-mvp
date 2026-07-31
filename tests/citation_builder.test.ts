import { CitationBuilder, Claim } from "../src/services/reports/report_narrative/citation_builder";
import { VerifiedClaim } from "../src/services/reports/report_narrative/data_verifier";

const builder = new CitationBuilder();

describe("CitationBuilder", () => {
  it("build converts all verified claims to claims", () => {
    const vcs: VerifiedClaim[] = [
      { text: "Revenue grew 20%", sourceRef: "src1", value: 20, verified: true, confidence: 0.95 },
      { text: "Costs decreased", sourceRef: "src2", value: 5, verified: false, confidence: 0.4 },
    ];
    const result = builder.build(vcs);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Revenue grew 20%");
    expect(result[0].verified).toBe(true);
  });

  it("build returns empty array for empty input", () => {
    expect(builder.build([])).toEqual([]);
  });

  it("countVerified returns correct counts", () => {
    const claims: Claim[] = [
      { text: "a", sourceRef: "s1", value: 1, verified: true, confidence: 1 },
      { text: "b", sourceRef: "s2", value: 2, verified: false, confidence: 0.5 },
      { text: "c", sourceRef: "s3", value: 3, verified: true, confidence: 0.8 },
    ];
    const [verified, total] = builder.countVerified(claims);
    expect(verified).toBe(2);
    expect(total).toBe(3);
  });

  it("countVerified with all verified", () => {
    const claims: Claim[] = [
      { text: "a", sourceRef: "s1", value: 1, verified: true, confidence: 1 },
    ];
    const [verified, total] = builder.countVerified(claims);
    expect(verified).toBe(1);
    expect(total).toBe(1);
  });

  it("build preserves value and sourceRef", () => {
    const vcs: VerifiedClaim[] = [
      { text: "Profit", sourceRef: "fin/1", value: 42.5, verified: true, confidence: 0.99 },
    ];
    const result = builder.build(vcs);
    expect(result[0].value).toBe(42.5);
    expect(result[0].sourceRef).toBe("fin/1");
  });

  it("countVerified returns zeroes for empty array", () => {
    const [verified, total] = builder.countVerified([]);
    expect(verified).toBe(0);
    expect(total).toBe(0);
  });

  it("build handles large input", () => {
    const vcs = Array.from({ length: 1000 }, (_, i) => ({
      text: `Claim ${i}`, sourceRef: `src/${i}`, value: i, verified: i % 2 === 0, confidence: 0.5,
    }));
    const result = builder.build(vcs);
    expect(result).toHaveLength(1000);
  });

  it("countVerified with all unverified", () => {
    const claims: Claim[] = [
      { text: "a", sourceRef: "s1", value: 1, verified: false, confidence: 0.1 },
      { text: "b", sourceRef: "s2", value: 2, verified: false, confidence: 0.2 },
    ];
    const [verified, total] = builder.countVerified(claims);
    expect(verified).toBe(0);
    expect(total).toBe(2);
  });
});
