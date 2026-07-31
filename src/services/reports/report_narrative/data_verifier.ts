export interface RawClaim {
  text: string;
  value: number;
  sourceRef: string;
}

export interface VerifiedClaim {
  text: string;
  value: number;
  sourceRef: string;
  verified: boolean;
  confidence: number;
}

export class DataVerifier {
  verify(
    claims: RawClaim[],
    numericData: Record<string, number>
  ): [VerifiedClaim[], number] {
    if (claims.length === 0) return [[], 1.0];

    const verified: VerifiedClaim[] = [];
    let verifiedCount = 0;

    for (const claim of claims) {
      const vc: VerifiedClaim = {
        text: claim.text,
        value: claim.value,
        sourceRef: claim.sourceRef,
        verified: false,
        confidence: 0,
      };

      if (claim.sourceRef in numericData) {
        const sourceVal = numericData[claim.sourceRef];
        vc.verified = this.withinTolerance(claim.value, sourceVal, 0.05);
        if (vc.verified) {
          verifiedCount++;
          vc.confidence = 1.0;
        } else {
          vc.confidence = this.computePartialConfidence(claim.value, sourceVal);
        }
      } else {
        const closestConf = this.findClosestMatch(claim.value, numericData);
        vc.verified = closestConf >= 0.95;
        vc.confidence = closestConf;
        if (vc.verified) verifiedCount++;
      }

      verified.push(vc);
    }

    const score = verifiedCount / claims.length;
    return [verified, score];
  }

  extractNumericClaims(
    text: string,
    sourceRef: string,
    numericData: Record<string, number>
  ): RawClaim[] {
    const pattern = /\b(\d+(?:[.,]\d+)*(?:\.\d+)?)\b/g;
    const matches = text.match(pattern);
    if (!matches) return [];

    const seen = new Set<number>();
    const claims: RawClaim[] = [];

    for (const m of matches) {
      const clean = m.replace(/,/g, "");
      const val = parseFloat(clean);
      if (isNaN(val) || seen.has(val) || val === 0) continue;
      seen.add(val);

      let bestRef = sourceRef;
      let bestConf = 0;

      for (const [ref, sv] of Object.entries(numericData)) {
        if (sv === 0) continue;
        const conf = this.computePartialConfidence(val, sv);
        if (conf > bestConf) {
          bestConf = conf;
          bestRef = ref;
        }
      }

      claims.push({ text: m, value: val, sourceRef: bestRef });
    }

    return claims;
  }

  private withinTolerance(a: number, b: number, pct: number): boolean {
    if (b === 0) return a === 0;
    return Math.abs(a - b) / Math.abs(b) <= pct;
  }

  private computePartialConfidence(a: number, b: number): number {
    if (b === 0) return a === 0 ? 1.0 : 0.0;
    const ratio = Math.abs(a - b) / Math.abs(b);
    if (ratio <= 0.05) return 1.0;
    if (ratio >= 1.0) return 0.0;
    return 1.0 - ratio;
  }

  private findClosestMatch(
    val: number,
    numericData: Record<string, number>
  ): number {
    let best = 0;
    for (const sv of Object.values(numericData)) {
      if (sv === 0) continue;
      const c = this.computePartialConfidence(val, sv);
      if (c > best) best = c;
    }
    return best;
  }
}
