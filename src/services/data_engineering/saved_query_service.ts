import { query } from "../db";

export class SavedQueryService {
  private async ensureSavedQueriesTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.saved_queries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        connection_id UUID NOT NULL REFERENCES public.client_database_connections(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        query_text TEXT NOT NULL,
        description TEXT,
        category VARCHAR(100),
        execution_count INTEGER DEFAULT 0,
        last_executed_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_saved_queries_organization ON public.saved_queries(organization_id);
      CREATE INDEX IF NOT EXISTS idx_saved_queries_connection ON public.saved_queries(connection_id);
      CREATE INDEX IF NOT EXISTS idx_saved_queries_category ON public.saved_queries(category) WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_saved_queries_name ON public.saved_queries(organization_id, name);
    `;
    try {
      await query(createTableSQL);
    } catch (err: any) {
      console.log(`Warning: could not create saved_queries table: ${err.message}`);
    }
    try {
      await query(indexesSQL);
    } catch (err: any) {
      console.log(`Warning: could not create indexes: ${err.message}`);
    }
  }

  private async getOrganizationIdByName(organizationName: string): Promise<string | null> {
    const result = await query(
      `SELECT id FROM public.organizations WHERE name ILIKE $1`,
      [organizationName],
    );
    return result.rows[0]?.id || null;
  }

  async saveQuery(
    organizationName: string,
    connectionID: string,
    name: string,
    queryText: string,
    description?: string | null,
    category?: string | null,
  ): Promise<Record<string, unknown>> {
    await this.ensureSavedQueriesTable();

    const orgID = await this.getOrganizationIdByName(organizationName);
    if (!orgID) {
      return { success: false, error: `Organization '${organizationName}' not found` };
    }

    try {
      const result = await query(`
        INSERT INTO public.saved_queries (
          organization_id, connection_id, name, query_text, description, category
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, query_text, description, category, created_at
      `, [orgID, connectionID, name, queryText, description ?? null, category ?? null]);

      const row = result.rows[0];
      const res: Record<string, unknown> = {
        success: true,
        id: row.id,
        name: row.name,
        query_text: row.query_text,
        created_at: row.created_at,
      };
      if (row.description != null) res.description = row.description;
      if (row.category != null) res.category = row.category;
      return res;
    } catch (err: any) {
      console.log(`Failed to save query: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async getSavedQueries(
    organizationName: string,
    connectionID?: string | null,
    category?: string | null,
    limit: number = 50,
  ): Promise<Record<string, unknown>> {
    await this.ensureSavedQueriesTable();

    const orgID = await this.getOrganizationIdByName(organizationName);
    if (!orgID) {
      return { success: false, queries: [], total: 0 };
    }

    try {
      const result = await query(`
        SELECT 
          sq.id,
          sq.name,
          sq.query_text,
          sq.description,
          sq.category,
          sq.created_at,
          sq.updated_at,
          sq.last_executed_at,
          sq.execution_count,
          cc.connection_name
        FROM public.saved_queries sq
        JOIN public.client_database_connections cc ON cc.id = sq.connection_id
        WHERE sq.organization_id = $1
          AND ($2::uuid IS NULL OR sq.connection_id = $2)
          AND ($3::text IS NULL OR sq.category = $3)
          AND sq.is_active = true
        ORDER BY sq.last_executed_at DESC NULLS LAST, sq.created_at DESC
        LIMIT $4
      `, [orgID, connectionID ?? null, category ?? null, limit]);

      const queries: Record<string, unknown>[] = result.rows.map((row: any) => {
        const q: Record<string, unknown> = {
          id: row.id,
          name: row.name,
          query_text: row.query_text,
          connection_name: row.connection_name,
          execution_count: row.execution_count,
        };
        if (row.description != null) q.description = row.description;
        if (row.category != null) q.category = row.category;
        if (row.created_at != null) q.created_at = row.created_at;
        if (row.updated_at != null) q.updated_at = row.updated_at;
        if (row.last_executed_at != null) q.last_executed_at = row.last_executed_at;
        return q;
      });

      return { success: true, queries, total: queries.length };
    } catch (err: any) {
      console.log(`Failed to get saved queries: ${err.message}`);
      return { success: false, queries: [], total: 0 };
    }
  }

  async updateSavedQuery(
    queryID: string,
    name?: string | null,
    queryText?: string | null,
    description?: string | null,
    category?: string | null,
  ): Promise<Record<string, unknown>> {
    await this.ensureSavedQueriesTable();

    const updates: string[] = [];
    const args: unknown[] = [];
    let idx = 1;

    if (name != null) {
      updates.push(`name = $${idx++}`);
      args.push(name);
    }
    if (queryText != null) {
      updates.push(`query_text = $${idx++}`);
      args.push(queryText);
    }
    if (description != null) {
      updates.push(`description = $${idx++}`);
      args.push(description);
    }
    if (category != null) {
      updates.push(`category = $${idx++}`);
      args.push(category);
    }

    if (updates.length === 0) {
      return { success: false, error: "No fields to update" };
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    args.push(queryID);

    const querySQL = `
      UPDATE public.saved_queries
      SET ${updates.join(", ")}
      WHERE id = $${idx} AND is_active = true
      RETURNING id
    `;

    try {
      const result = await query(querySQL, args);
      if (!result.rows[0]) {
        return { success: false, message: "Query not found" };
      }
      return { success: true, message: "Query updated successfully" };
    } catch (err: any) {
      console.log(`Failed to update saved query: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async resolveQueryIDByName(
    orgName: string,
    connectionName: string,
    queryName: string,
  ): Promise<string> {
    const orgID = await this.getOrganizationIdByName(orgName);
    if (!orgID) {
      throw new Error(`organization not found: ${orgName}`);
    }

    const connResult = await query(
      `SELECT id FROM public.client_database_connections WHERE organization_id = $1 AND connection_name = $2 AND is_active = true`,
      [orgID, connectionName],
    );
    if (!connResult.rows[0]) {
      throw new Error(`connection not found: ${connectionName}`);
    }
    const connID = connResult.rows[0].id;

    const qResult = await query(
      `SELECT id FROM public.saved_queries WHERE organization_id = $1 AND connection_id = $2 AND name = $3 AND is_active = true`,
      [orgID, connID, queryName],
    );
    if (!qResult.rows[0]) {
      throw new Error(`saved query not found: ${queryName}`);
    }
    return qResult.rows[0].id;
  }

  async deleteSavedQuery(queryID: string): Promise<Record<string, unknown>> {
    await this.ensureSavedQueriesTable();

    try {
      const result = await query(`
        UPDATE public.saved_queries
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING id
      `, [queryID]);

      if (!result.rows[0]) {
        return { success: false, message: "Query not found" };
      }
      return { success: true, message: "Query deleted successfully" };
    } catch (err: any) {
      console.log(`Failed to delete saved query: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async updateExecutionStats(queryID: string): Promise<void> {
    try {
      await query(`
        UPDATE public.saved_queries
        SET last_executed_at = CURRENT_TIMESTAMP,
            execution_count = COALESCE(execution_count, 0) + 1
        WHERE id = $1 AND is_active = true
      `, [queryID]);
    } catch (err: any) {
      console.log(`Warning: failed to update execution stats: ${err.message}`);
    }
  }
}
