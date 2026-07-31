import { query } from "../db";

export interface ExportFilters {
  organization_id?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  product_id?: string;
  region?: string;
  channel?: string;
  customer_segment?: string;
  min_amount?: number;
  max_amount?: number;
  min_quantity?: number;
  max_quantity?: number;
  metadata_filters?: Record<string, string>;
}

export interface SalesRecordExport {
  id: string;
  organization_id: string;
  amount: number;
  date?: string;
  category?: string;
  product_id?: string;
  region?: string;
  channel?: string;
  customer_segment?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ExportFiltersApplied {
  start_date?: string;
  end_date?: string;
  category?: string;
  product_id?: string;
  region?: string;
  channel?: string;
  customer_segment?: string;
  min_amount?: number;
  max_amount?: number;
  min_quantity?: number;
  max_quantity?: number;
}

export interface ExportResult {
  success: boolean;
  error?: string;
  total_records: number;
  returned_records: number;
  limit: number;
  offset: number;
  data: SalesRecordExport[];
  filters: ExportFiltersApplied;
}

export interface DateRangeInfo {
  earliest?: string;
  latest?: string;
}

export interface ExportStats {
  success: boolean;
  error?: string;
  total_records: number;
  total_amount: number;
  avg_amount: number;
  distinct_categories: number;
  distinct_products: number;
  distinct_regions: number;
  distinct_channels: number;
  date_range: DateRangeInfo;
}

export class ExportSalesRecordsService {
  private buildWhereClause(filters: ExportFilters): { clause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.organization_id) {
      conditions.push(`organization_id = $${params.length + 1}`);
      params.push(filters.organization_id);
    }
    if (filters.start_date) {
      conditions.push(`date >= $${params.length + 1}`);
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      conditions.push(`date <= $${params.length + 1}`);
      params.push(filters.end_date);
    }
    if (filters.category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(filters.category);
    }
    if (filters.product_id) {
      conditions.push(`product_id = $${params.length + 1}`);
      params.push(filters.product_id);
    }
    if (filters.region) {
      conditions.push(`region = $${params.length + 1}`);
      params.push(filters.region);
    }
    if (filters.channel) {
      conditions.push(`channel = $${params.length + 1}`);
      params.push(filters.channel);
    }
    if (filters.customer_segment) {
      conditions.push(`customer_segment = $${params.length + 1}`);
      params.push(filters.customer_segment);
    }
    if (filters.min_amount !== undefined) {
      conditions.push(`amount >= $${params.length + 1}`);
      params.push(filters.min_amount);
    }
    if (filters.max_amount !== undefined) {
      conditions.push(`amount <= $${params.length + 1}`);
      params.push(filters.max_amount);
    }
    if (filters.min_quantity !== undefined) {
      conditions.push(`quantity >= $${params.length + 1}`);
      params.push(filters.min_quantity);
    }
    if (filters.max_quantity !== undefined) {
      conditions.push(`quantity <= $${params.length + 1}`);
      params.push(filters.max_quantity);
    }
    if (filters.metadata_filters) {
      for (const [key, value] of Object.entries(filters.metadata_filters)) {
        conditions.push(`metadata->>'${key}' = $${params.length + 1}`);
        params.push(value);
      }
    }

    const clause = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    return { clause, params };
  }

  async exportSalesRecords(
    filters: ExportFilters,
    limit = 10000,
    offset = 0,
  ): Promise<ExportResult> {
    if (offset < 0) offset = 0;

    const { clause, params } = this.buildWhereClause(filters);

    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.sales_records WHERE ${clause}`,
      params
    );
    const totalRecords = countResult.rows[0]?.total ?? 0;

    const dataParams = [...params, limit, offset];
    const dataResult = await query(
      `SELECT
        id,
        organization_id,
        amount,
        date,
        category,
        product_id,
        region,
        channel,
        customer_segment,
        quantity,
        metadata,
        created_at,
        updated_at
       FROM public.sales_records
       WHERE ${clause}
       ORDER BY date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    );

    const data: SalesRecordExport[] = dataResult.rows.map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      amount: row.amount,
      date: row.date ? new Date(row.date).toISOString() : undefined,
      category: row.category || undefined,
      product_id: row.product_id || undefined,
      region: row.region || undefined,
      channel: row.channel || undefined,
      customer_segment: row.customer_segment || undefined,
      quantity: row.quantity || undefined,
      metadata: row.metadata || undefined,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }));

    const appliedFilters: ExportFiltersApplied = {};
    if (filters.start_date) appliedFilters.start_date = filters.start_date;
    if (filters.end_date) appliedFilters.end_date = filters.end_date;
    if (filters.category) appliedFilters.category = filters.category;
    if (filters.product_id) appliedFilters.product_id = filters.product_id;
    if (filters.region) appliedFilters.region = filters.region;
    if (filters.channel) appliedFilters.channel = filters.channel;
    if (filters.customer_segment) appliedFilters.customer_segment = filters.customer_segment;
    if (filters.min_amount !== undefined) appliedFilters.min_amount = filters.min_amount;
    if (filters.max_amount !== undefined) appliedFilters.max_amount = filters.max_amount;
    if (filters.min_quantity !== undefined) appliedFilters.min_quantity = filters.min_quantity;
    if (filters.max_quantity !== undefined) appliedFilters.max_quantity = filters.max_quantity;

    return {
      success: true,
      total_records: totalRecords,
      returned_records: data.length,
      limit,
      offset,
      data,
      filters: appliedFilters,
    };
  }

  async getExportStats(
    organizationID: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExportStats> {
    const filters: ExportFilters = {
      organization_id: organizationID,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    };

    const { clause, params } = this.buildWhereClause(filters);

    const result = await query(
      `SELECT
        COUNT(*) as total_records,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_amount,
        COUNT(DISTINCT category) as distinct_categories,
        COUNT(DISTINCT product_id) as distinct_products,
        COUNT(DISTINCT region) as distinct_regions,
        COUNT(DISTINCT channel) as distinct_channels,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
       FROM public.sales_records
       WHERE ${clause}`,
      params
    );

    const row = result.rows[0];

    return {
      success: true,
      total_records: row.total_records,
      total_amount: row.total_amount,
      avg_amount: row.avg_amount,
      distinct_categories: row.distinct_categories,
      distinct_products: row.distinct_products,
      distinct_regions: row.distinct_regions,
      distinct_channels: row.distinct_channels,
      date_range: {
        earliest: row.earliest_date ? new Date(row.earliest_date).toISOString() : undefined,
        latest: row.latest_date ? new Date(row.latest_date).toISOString() : undefined,
      },
    };
  }

  async exportSalesRecordsStream(
    filters: ExportFilters,
    batchSize = 1000,
    callback: (batch: SalesRecordExport[]) => Promise<void>,
  ): Promise<void> {
    const { clause, params } = this.buildWhereClause(filters);

    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.sales_records WHERE ${clause}`,
      params
    );
    const totalRecords = countResult.rows[0]?.total ?? 0;

    let offset = 0;
    while (offset < totalRecords) {
      const dataParams = [...params, batchSize, offset];
      const dataResult = await query(
        `SELECT
          id,
          organization_id,
          amount,
          date,
          category,
          product_id,
          region,
          channel,
          customer_segment,
          quantity,
          metadata,
          created_at,
          updated_at
         FROM public.sales_records
         WHERE ${clause}
         ORDER BY date DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        dataParams
      );

      const batch: SalesRecordExport[] = dataResult.rows.map((row: any) => ({
        id: row.id,
        organization_id: row.organization_id,
        amount: row.amount,
        date: row.date ? new Date(row.date).toISOString() : undefined,
        category: row.category || undefined,
        product_id: row.product_id || undefined,
        region: row.region || undefined,
        channel: row.channel || undefined,
        customer_segment: row.customer_segment || undefined,
        quantity: row.quantity || undefined,
        metadata: row.metadata || undefined,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      }));

      if (batch.length > 0) {
        await callback(batch);
      }

      offset += batchSize;
    }
  }
}
