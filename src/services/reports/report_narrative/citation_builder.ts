import { VerifiedClaim } from "./data_verifier";

export interface Claim {
  text: string;
  sourceRef: string;
  value: number;
  verified: boolean;
  confidence: number;
}

export class CitationBuilder {
  build(verified: VerifiedClaim[]): Claim[] {
    return verified.map((vc) => ({
      text: vc.text,
      sourceRef: vc.sourceRef,
      value: vc.value,
      verified: vc.verified,
      confidence: vc.confidence,
    }));
  }

  countVerified(claims: Claim[]): [number, number] {
    let verified = 0;
    for (const c of claims) {
      if (c.verified) verified++;
    }
    return [verified, claims.length];
  }
}
