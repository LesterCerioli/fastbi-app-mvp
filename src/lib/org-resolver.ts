import { query } from "@/services/db";

export async function resolveOrganizationID(organizationName: string): Promise<string> {
  if (!organizationName) throw new Error("organization_name is required");
  const result = await query(
    `SELECT id FROM public.organizations WHERE name = $1`,
    [organizationName]
  );
  if (!result.rows[0]) {
    throw new Error(`organization not found: ${organizationName}`);
  }
  return result.rows[0].id;
}
