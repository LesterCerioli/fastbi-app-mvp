export interface OrganizationData {
  organizationName: string;
  taxId: string;
  address: string;
}

export interface AdminData {
  fullName: string;
  email: string;
  password: string;
}

export interface SubscriptionData {
  planKey: string;
  planName: string;
  billingCycle: "monthly" | "annual";
  amount: number;
}
