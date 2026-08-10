export interface PlanDefinition {
  key: string;
  name: string;
  desc: string;
  monthlyPrice: number;
  maxUsers: number | null;
  annualDiscount: number;
}

export const PLANS: PlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    desc: "Perfect for small teams getting started",
    monthlyPrice: 39,
    maxUsers: 10,
    annualDiscount: 0.2,
  },
  {
    key: "professional",
    name: "Professional",
    desc: "Best for growing businesses",
    monthlyPrice: 89,
    maxUsers: 200,
    annualDiscount: 0.2,
  },
  {
    key: "business",
    name: "Business",
    desc: "Advanced features for large organizations",
    monthlyPrice: 149,
    maxUsers: null,
    annualDiscount: 0.2,
  },
];

export function getPlanByKey(planKey: string): PlanDefinition | null {
  return PLANS.find((p) => p.key === planKey) || null;
}

export function annualUnitAmount(plan: PlanDefinition): number {
  return Math.round(plan.monthlyPrice * 12 * (1 - plan.annualDiscount));
}