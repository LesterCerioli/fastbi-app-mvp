import { AgentRepository } from "./repository";

export interface BehavioralPattern {
  id: string;
  triggerSignature: string;
  actionTaken: string;
  outcomeSuccess: number;
  effectiveness: number;
}

export class BehavioralMemory {
  constructor(private repo: AgentRepository) {}

  async recordPattern(
    orgId: string,
    trigger: Record<string, any>,
    action: string,
    outcomeSuccess: number
  ): Promise<void> {
    const triggerSignature = this.generateTriggerSignature(trigger);
    const effectiveness = this.calculateEffectiveness(outcomeSuccess);
    await this.repo.savePattern(orgId, triggerSignature, action, outcomeSuccess, effectiveness);
  }

  async findSimilarPatterns(
    orgId: string,
    currentTrigger: Record<string, any>,
    limit: number
  ): Promise<BehavioralPattern[]> {
    const triggerSignature = this.generateTriggerSignature(currentTrigger);

    const patterns = await this.repo.findSimilarPatterns(orgId, triggerSignature, limit);

    return patterns.filter((p) => p.effectiveness > 0.3);
  }

  async getBestPatternForSituation(
    orgId: string,
    situation: Record<string, any>
  ): Promise<BehavioralPattern | null> {
    const patterns = await this.findSimilarPatterns(orgId, situation, 5);
    if (patterns.length === 0) return null;

    let best = patterns[0];
    for (const p of patterns.slice(1)) {
      if (p.effectiveness > best.effectiveness) {
        best = p;
      }
    }
    return best;
  }

  private generateTriggerSignature(trigger: Record<string, any>): string {
    const parts: string[] = [];

    if (typeof trigger["metric"] === "string") {
      parts.push(trigger["metric"]);
    }

    if (typeof trigger["change_percent"] === "number") {
      const change = trigger["change_percent"];
      if (change > 0) {
        parts.push(`growth_${Math.floor(change / 10) * 10}`);
      } else if (change < 0) {
        parts.push(`decline_${Math.floor(-change / 10) * 10}`);
      }
    }

    if (typeof trigger["dimension"] === "string") {
      parts.push(trigger["dimension"]);
    }

    if (parts.length === 0) {
      parts.push("general");
    }

    const signature = parts.join("_");
    const hash = this.sha256(signature);
    return hash.slice(0, 32);
  }

  private calculateEffectiveness(outcomeSuccess: number): number {
    if (outcomeSuccess < 0) return 0;
    if (outcomeSuccess > 1) return 1;
    if (outcomeSuccess > 0.8) return outcomeSuccess * 1.1;
    return outcomeSuccess;
  }

  private sha256(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    let fullHex = hex;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < input.length; j++) {
        const chr = input.charCodeAt(j);
        hash = ((hash << 5) - hash) + chr + i;
        hash |= 0;
      }
      fullHex += Math.abs(hash).toString(16).padStart(8, "0");
    }
    return fullHex;
  }
}
