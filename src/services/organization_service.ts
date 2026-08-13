import { v4 as uuidv4 } from "uuid";
import { query, queryTx } from "./db";

export interface CreateOrgDTO {
  name: string;
  address?: string | null;
  cnpj?: string | null;
  ein?: string | null;
}

export interface UpdateOrgDTO {
  name?: string | null;
  address?: string | null;
  cnpj?: string | null;
  ein?: string | null;
}

export interface OrgResponseDTO {
  id: string;
  name: string;
  address: string | null;
  cnpj: string | null;
  ein: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrgDetailDTO extends OrgResponseDTO {
  statistics: Record<string, unknown>;
}

export interface OrgFilterDTO {
  page: number;
  pageSize: number;
}

export interface OrgListDTO {
  organizations: OrgResponseDTO[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CNPJValidationDTO {
  cnpj: string;
  is_valid_format: boolean;
  is_available: boolean;
  cleaned_cnpj: string;
}

export interface EINValidationDTO {
  ein: string;
  is_valid_format: boolean;
  is_available: boolean;
  cleaned_ein: string;
}

export function defaultOrgFilter(): OrgFilterDTO {
  return { page: 1, pageSize: 100 };
}

export class OrganizationService {
  async create(data: CreateOrgDTO): Promise<OrgResponseDTO> {
    const name = data.name.trim();
    if (!name) throw new Error("organization name cannot be empty");

    return queryTx(async (q) => {
      if (data.cnpj) {
        const existing = await q(
          `SELECT id FROM public.organizations WHERE cnpj = $1 AND deleted_at IS NULL`,
          [data.cnpj]
        );
        if (existing.rows[0]) throw new Error(`organization with CNPJ ${data.cnpj} already exists`);
      }
      if (data.ein) {
        const existing = await q(
          `SELECT id FROM public.organizations WHERE ein = $1 AND deleted_at IS NULL`,
          [data.ein]
        );
        if (existing.rows[0]) throw new Error(`organization with EIN ${data.ein} already exists`);
      }

      const id = uuidv4();
      const now = new Date();

      const result = await q(
        `INSERT INTO public.organizations (id, name, address, cnpj, ein, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, address, cnpj, ein, created_at, updated_at`,
        [id, name, data.address || null, data.cnpj || null, data.ein || null, now, now]
      );
      return result.rows[0];
    });
  }

  async getByID(organizationID: string): Promise<OrgDetailDTO | null> {
    const result = await query(
      `SELECT id, name, address, cnpj, ein, created_at, updated_at
       FROM public.organizations WHERE id = $1 AND deleted_at IS NULL`,
      [organizationID]
    );
    if (!result.rows[0]) return null;

    const stats = await this.getOrganizationStatistics(organizationID);
    return { ...result.rows[0], statistics: stats };
  }

  async update(organizationID: string, data: UpdateOrgDTO): Promise<OrgResponseDTO | null> {
    const exists = await query(
      `SELECT id FROM public.organizations WHERE id = $1 AND deleted_at IS NULL`,
      [organizationID]
    );
    if (!exists.rows[0]) return null;

    return queryTx(async (q) => {
      const updates: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (data.cnpj) {
        const conflict = await q(
          `SELECT id FROM public.organizations WHERE cnpj = $1 AND id != $2 AND deleted_at IS NULL`,
          [data.cnpj, organizationID]
        );
        if (conflict.rows[0]) throw new Error(`organization with CNPJ ${data.cnpj} already exists`);
        updates.push(`cnpj = $${idx++}`);
        params.push(data.cnpj);
      }
      if (data.ein) {
        const conflict = await q(
          `SELECT id FROM public.organizations WHERE ein = $1 AND id != $2 AND deleted_at IS NULL`,
          [data.ein, organizationID]
        );
        if (conflict.rows[0]) throw new Error(`organization with EIN ${data.ein} already exists`);
        updates.push(`ein = $${idx++}`);
        params.push(data.ein);
      }
      if (data.name !== undefined && data.name !== null) {
        updates.push(`name = $${idx++}`);
        params.push(data.name);
      }
      if (data.address !== undefined) {
        updates.push(`address = $${idx++}`);
        params.push(data.address);
      }

      if (updates.length === 0) {
        return this.getByID(organizationID);
      }

      updates.push(`updated_at = $${idx++}`);
      params.push(new Date());
      params.push(organizationID);

      const result = await q(
        `UPDATE public.organizations SET ${updates.join(", ")}
         WHERE id = $${idx} AND deleted_at IS NULL
         RETURNING id, name, address, cnpj, ein, created_at, updated_at`,
        params
      );
      return result.rows[0] || null;
    });
  }

  async delete(organizationID: string): Promise<void> {
    const exists = await query(
      `SELECT id FROM public.organizations WHERE id = $1 AND deleted_at IS NULL`,
      [organizationID]
    );
    if (!exists.rows[0]) throw new Error(`organization with ID ${organizationID} not found`);

    await queryTx(async (q) => {
      const users = await q(
        `SELECT COUNT(*) FROM public.users WHERE organization_id = $1 AND deleted_at IS NULL`,
        [organizationID]
      );
      if (parseInt(users.rows[0]?.count || "0", 10) > 0) {
        throw new Error("cannot delete organization with associated users");
      }

      await q(
        `UPDATE public.organizations SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL`,
        [new Date(), organizationID]
      );
    });
  }

  async getByCNPJ(cnpj: string): Promise<OrgResponseDTO | null> {
    const result = await query(
      `SELECT id, name, address, cnpj, ein, created_at, updated_at
       FROM public.organizations WHERE cnpj = $1 AND deleted_at IS NULL`,
      [cnpj]
    );
    return result.rows[0] || null;
  }

  async getByEIN(ein: string): Promise<OrgResponseDTO | null> {
    const result = await query(
      `SELECT id, name, address, cnpj, ein, created_at, updated_at
       FROM public.organizations WHERE ein = $1 AND deleted_at IS NULL`,
      [ein]
    );
    return result.rows[0] || null;
  }

  async search(queryStr: string, filter?: OrgFilterDTO): Promise<OrgListDTO> {
    if (!queryStr.trim()) throw new Error("search query cannot be empty");
    const f = { ...defaultOrgFilter(), ...filter };
    const searchParam = `%${queryStr}%`;

    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.organizations
       WHERE deleted_at IS NULL AND (name ILIKE $1 OR address ILIKE $1 OR cnpj ILIKE $1 OR ein ILIKE $1)`,
      [searchParam]
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0", 10);

    const offset = (f.page - 1) * f.pageSize;
    const dataResult = await query(
      `SELECT id, name, address, cnpj, ein, created_at, updated_at
       FROM public.organizations WHERE deleted_at IS NULL AND
       (name ILIKE $1 OR address ILIKE $1 OR cnpj ILIKE $1 OR ein ILIKE $1)
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [searchParam, f.pageSize, offset]
    );

    return {
      organizations: dataResult.rows,
      total_count: totalCount,
      page: f.page,
      page_size: f.pageSize,
      total_pages: Math.ceil(totalCount / f.pageSize),
    };
  }

  async getByName(name: string, filter?: OrgFilterDTO): Promise<OrgListDTO> {
    if (!name.trim()) throw new Error("organization name cannot be empty");
    const f = { ...defaultOrgFilter(), ...filter };
    const searchParam = `%${name}%`;

    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.organizations WHERE name ILIKE $1 AND deleted_at IS NULL`,
      [searchParam]
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0", 10);

    const offset = (f.page - 1) * f.pageSize;
    const dataResult = await query(
      `SELECT id, name, address, cnpj, ein, created_at, updated_at
       FROM public.organizations WHERE name ILIKE $1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [searchParam, f.pageSize, offset]
    );

    return {
      organizations: dataResult.rows,
      total_count: totalCount,
      page: f.page,
      page_size: f.pageSize,
      total_pages: Math.ceil(totalCount / f.pageSize),
    };
  }

  async getAll(filter?: OrgFilterDTO): Promise<OrgListDTO> {
    const f = { ...defaultOrgFilter(), ...filter };

    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.organizations WHERE deleted_at IS NULL`
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0", 10);

    const offset = (f.page - 1) * f.pageSize;
    const dataResult = await query(
      `SELECT id, name, address, cnpj, ein, created_at, updated_at
       FROM public.organizations WHERE deleted_at IS NULL
       ORDER BY created_at DESC, id LIMIT $1 OFFSET $2`,
      [f.pageSize, offset]
    );

    return {
      organizations: dataResult.rows,
      total_count: totalCount,
      page: f.page,
      page_size: f.pageSize,
      total_pages: Math.ceil(totalCount / f.pageSize),
    };
  }

  async validateCNPJ(cnpj: string): Promise<CNPJValidationDTO> {
    const cleaned = cnpj.replace(/\D/g, "");
    const isValidFormat = cleaned.length === 14;

    let isAvailable = false;
    if (isValidFormat) {
      const result = await query(
        `SELECT id FROM public.organizations WHERE cnpj = $1 AND deleted_at IS NULL`,
        [cnpj]
      );
      isAvailable = !result.rows[0];
    }

    return { cnpj, is_valid_format: isValidFormat, is_available: isAvailable, cleaned_cnpj: cleaned };
  }

  async validateEIN(ein: string): Promise<EINValidationDTO> {
    const cleaned = ein.replace(/\D/g, "");
    const isValidFormat = cleaned.length === 9;

    let isAvailable = false;
    if (isValidFormat) {
      const result = await query(
        `SELECT id FROM public.organizations WHERE ein = $1 AND deleted_at IS NULL`,
        [ein]
      );
      isAvailable = !result.rows[0];
    }

    return { ein, is_valid_format: isValidFormat, is_available: isAvailable, cleaned_ein: cleaned };
  }

  async deactivate(organizationID: string): Promise<OrgResponseDTO | null> {
    const result = await query(
      `UPDATE public.organizations SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, address, cnpj, ein, created_at, updated_at`,
      [new Date(), organizationID]
    );
    return result.rows[0] || null;
  }

  async reactivate(organizationID: string): Promise<OrgResponseDTO | null> {
    const result = await query(
      `UPDATE public.organizations SET deleted_at = NULL, updated_at = $1 WHERE id = $2
       RETURNING id, name, address, cnpj, ein, created_at, updated_at`,
      [new Date(), organizationID]
    );
    return result.rows[0] || null;
  }

  async getOrganizationStatistics(organizationID: string): Promise<Record<string, unknown>> {
    const userCount = await query(
      `SELECT COUNT(*) FROM public.users WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationID]
    );

    return {
      user_count: parseInt(userCount.rows[0]?.count || "0", 10),
    };
  }
}
