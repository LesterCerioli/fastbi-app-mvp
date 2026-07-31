import { query } from "../db";
import { EnhancedTFIDFVectorizer } from "./vectorizer";
import type { QueryIntent } from "./vectorizer";
import { LinearRegressionModel } from "./ml_model";

export interface TrendPoint {
  period: string;
  value: number;
}

export interface TrendPredictionResponse {
  predictedValue: number;
  confidence: number;
  historicalTrend: TrendPoint[];
}

export interface ProductMetric {
  productId: string;
  quantity: number;
  revenue: number;
}

export interface CategoryMetric {
  category: string;
  revenue: number;
  count: number;
}

export interface RegionMetric {
  region: string;
  revenue: number;
}

export interface SalesInsights {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  topProducts: ProductMetric[];
  topCategories: CategoryMetric[];
  channelBreakdown: Record<string, number>;
  customerSegmentBreakdown: Record<string, number>;
  seasonalPattern: Record<string, number>;
  growthRate: number;
  topRegions: RegionMetric[];
}

export interface ContextResult {
  tableName: string;
  data: Record<string, any>;
  similarity: number;
}

export interface DynamicTable {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
}

export class SalesAnalyzerImpl {
  private vectorizer: EnhancedTFIDFVectorizer;
  private mlModel: LinearRegressionModel;
  private cache: Map<string, any>;

  constructor() {
    this.vectorizer = new EnhancedTFIDFVectorizer();
    this.mlModel = new LinearRegressionModel();
    this.cache = new Map();
  }

  private async resolveOrganizationID(organizationName: string): Promise<string> {
    if (!organizationName) throw new Error("organization name is required");

    const r = await query(`SELECT id FROM public.organizations WHERE name = $1`, [organizationName]);
    if (r.rows.length === 0) throw new Error(`organization not found with name: ${organizationName}`);
    return r.rows[0].id;
  }

  async askQuestion(organizationName: string, question: string): Promise<string> {
    if (!organizationName) throw new Error("organization_name is required");
    if (!question) throw new Error("question is required");

    const organizationId = await this.resolveOrganizationID(organizationName);
    const intent = this.vectorizer.nlp.extractIntent(question);

    let sql = "";
    const args: any[] = [organizationId];

    switch (intent.aggregation) {
      case "sum":
        sql = `SELECT COALESCE(SUM(amount), 0) FROM sales_records WHERE organization_id = $1`;
        break;
      case "count":
        sql = `SELECT COUNT(*) FROM sales_records WHERE organization_id = $1`;
        break;
      case "avg":
        sql = `SELECT COALESCE(AVG(amount), 0) FROM sales_records WHERE organization_id = $1`;
        break;
      default:
        sql = `SELECT COALESCE(SUM(amount), 0) FROM sales_records WHERE organization_id = $1`;
    }

    if (intent.entityName) {
      switch (intent.entity) {
        case "product":
          sql += ` AND product_id = $2`;
          args.push(intent.entityName);
          break;
        case "category":
          sql += ` AND category = $2`;
          args.push(intent.entityName);
          break;
        case "region":
          sql += ` AND region = $2`;
          args.push(intent.entityName);
          break;
        case "channel":
          sql += ` AND channel = $2`;
          args.push(intent.entityName);
          break;
      }
    }

    const r = await query(sql, args);
    const result = Number(r.rows[0][0] ?? r.rows[0].coalesce ?? 0);

    return this.generateNaturalLanguageResponse(intent, result);
  }

  async predictSalesTrend(organizationName: string, periodsAhead: number): Promise<TrendPredictionResponse> {
    if (!organizationName) throw new Error("organization_name is required");

    const organizationId = await this.resolveOrganizationID(organizationName);
    if (periodsAhead === 0) periodsAhead = 1;

    const r = await query(
      `SELECT
         DATE_TRUNC('month', date) as month,
         SUM(amount) as total_sales
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month ASC`,
      [organizationId]
    );

    const periods: string[] = [];
    const values: number[] = [];

    for (const row of r.rows) {
      periods.push(this.formatMonth(row.month));
      values.push(Number(row.total_sales));
    }

    if (values.length < 3) {
      throw new Error("insufficient data for prediction (need at least 3 months)");
    }

    const features: number[][] = [];
    const labels: number[] = [];

    for (let i = 0; i < values.length - 1; i++) {
      features.push([i, values[i]]);
      labels.push(values[i + 1]);
    }

    await this.mlModel.train(features, labels);

    const lastFeatures = [values.length - 1, values[values.length - 1]];
    const prediction = await this.mlModel.predict(lastFeatures);
    const confidence = this.calculateConfidence(values);

    const trendPoints: TrendPoint[] = periods.map((p, i) => ({
      period: p,
      value: values[i],
    }));

    return {
      predictedValue: prediction,
      confidence,
      historicalTrend: trendPoints,
    };
  }

  async generateSalesInsights(organizationName: string): Promise<SalesInsights> {
    if (!organizationName) throw new Error("organization_name is required");

    const organizationId = await this.resolveOrganizationID(organizationName);

    const metricsR = await query(
      `SELECT
         COALESCE(SUM(amount), 0) as total_revenue,
         COUNT(*) as total_transactions,
         COALESCE(AVG(amount), 0) as avg_order_value
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '12 months'`,
      [organizationId]
    );

    const insights: SalesInsights = {
      totalRevenue: Number(metricsR.rows[0].total_revenue),
      totalTransactions: Number(metricsR.rows[0].total_transactions),
      averageOrderValue: Number(metricsR.rows[0].avg_order_value),
      topProducts: [],
      topCategories: [],
      channelBreakdown: {},
      customerSegmentBreakdown: {},
      seasonalPattern: {},
      growthRate: 0,
      topRegions: [],
    };

    const productsR = await query(
      `SELECT
         product_id,
         COALESCE(SUM(quantity), 0) as total_quantity,
         COALESCE(SUM(amount), 0) as total_revenue
       FROM public.sales_records
       WHERE organization_id = $1 AND product_id IS NOT NULL AND product_id != ''
       GROUP BY product_id
       ORDER BY total_revenue DESC
       LIMIT 10`,
      [organizationId]
    );

    insights.topProducts = productsR.rows.map((row: any) => ({
      productId: row.product_id,
      quantity: Number(row.total_quantity),
      revenue: Number(row.total_revenue),
    }));

    const catsR = await query(
      `SELECT
         category,
         COALESCE(SUM(amount), 0) as total_revenue,
         COUNT(*) as transaction_count
       FROM public.sales_records
       WHERE organization_id = $1 AND category IS NOT NULL AND category != ''
       GROUP BY category
       ORDER BY total_revenue DESC
       LIMIT 5`,
      [organizationId]
    );

    insights.topCategories = catsR.rows.map((row: any) => ({
      category: row.category,
      revenue: Number(row.total_revenue),
      count: Number(row.transaction_count),
    }));

    const channelR = await query(
      `SELECT
         channel,
         COALESCE(SUM(amount), 0) as total_revenue
       FROM public.sales_records
       WHERE organization_id = $1 AND channel IS NOT NULL
       GROUP BY channel
       ORDER BY total_revenue DESC`,
      [organizationId]
    );

    for (const row of channelR.rows) {
      insights.channelBreakdown[row.channel] = Number(row.total_revenue);
    }

    const segmentR = await query(
      `SELECT
         customer_segment,
         COALESCE(SUM(amount), 0) as total_revenue
       FROM public.sales_records
       WHERE organization_id = $1 AND customer_segment IS NOT NULL
       GROUP BY customer_segment
       ORDER BY total_revenue DESC`,
      [organizationId]
    );

    for (const row of segmentR.rows) {
      insights.customerSegmentBreakdown[row.customer_segment] = Number(row.total_revenue);
    }

    const seasonalR = await query(
      `SELECT
         EXTRACT(MONTH FROM date) as month,
         COALESCE(AVG(amount), 0) as avg_revenue
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '24 months'
       GROUP BY EXTRACT(MONTH FROM date)
       ORDER BY month`,
      [organizationId]
    );

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (const row of seasonalR.rows) {
      const monthIdx = Number(row.month);
      if (monthIdx >= 1 && monthIdx <= 12) {
        insights.seasonalPattern[months[monthIdx - 1]] = Number(row.avg_revenue);
      }
    }

    const growthR = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '3 months' THEN amount ELSE 0 END), 0) as last3,
         COALESCE(SUM(CASE WHEN date >= NOW() - INTERVAL '6 months' AND date < NOW() - INTERVAL '3 months' THEN amount ELSE 0 END), 0) as prev3`,
      [organizationId]
    );

    const last3 = Number(growthR.rows[0].last3);
    const prev3 = Number(growthR.rows[0].prev3);
    if (prev3 > 0) {
      insights.growthRate = ((last3 - prev3) / prev3) * 100;
    }

    const regionR = await query(
      `SELECT
         region,
         COALESCE(SUM(amount), 0) as total_revenue
       FROM public.sales_records
       WHERE organization_id = $1 AND region IS NOT NULL
       GROUP BY region
       ORDER BY total_revenue DESC
       LIMIT 5`,
      [organizationId]
    );

    insights.topRegions = regionR.rows.map((row: any) => ({
      region: row.region,
      revenue: Number(row.total_revenue),
    }));

    return insights;
  }

  async retrieveSimilarContext(
    organizationName: string,
    queryStr: string,
    tableName: string
  ): Promise<ContextResult[]> {
    if (!organizationName) throw new Error("organization_name is required");

    const organizationId = await this.resolveOrganizationID(organizationName);
    const resolvedTable = tableName !== "sales_records" ? "sales_records" : tableName;

    const queryVector = this.vectorizer.textToVector(queryStr);

    const r = await query(
      `SELECT
         id, amount, date,
         COALESCE(category, '') as category,
         COALESCE(product_id, '') as product_id,
         COALESCE(region, '') as region,
         COALESCE(channel, '') as channel,
         COALESCE(customer_segment, '') as customer_segment,
         quantity,
         COALESCE(metadata::text, '') as metadata_text
       FROM public.sales_records
       WHERE organization_id = $1 AND date >= NOW() - INTERVAL '365 days'
       LIMIT 1000`,
      [organizationId]
    );

    const results: ContextResult[] = [];

    for (const row of r.rows) {
      const rowText = `${row.category} ${row.product_id} ${row.region} ${row.channel} ${row.customer_segment} ${row.metadata_text}`;
      const rowVector = this.vectorizer.textToVector(rowText);
      const similarity = this.vectorizer.cosineSimilarity(queryVector, rowVector);

      if (similarity > 0.2) {
        results.push({
          tableName: resolvedTable,
          data: {
            id: row.id,
            amount: Number(row.amount),
            date: row.date,
            category: row.category,
            product_id: row.product_id,
            region: row.region,
            channel: row.channel,
            customer_segment: row.customer_segment,
            quantity: row.quantity ?? 0,
            similarity,
          },
          similarity,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, 10);
  }

  async discoverTables(_organizationName: string): Promise<DynamicTable[]> {
    const r = await query(
      `SELECT
         'sales_records' as table_name,
         COUNT(*) as row_count,
         array_agg(column_name::text) as columns
       FROM information_schema.columns
       WHERE table_name = 'sales_records'
       GROUP BY table_name

       UNION ALL

       SELECT
         'analysis_history' as table_name,
         COUNT(*) as row_count,
         array_agg(column_name::text) as columns
       FROM information_schema.columns
       WHERE table_name = 'analysis_history'
       GROUP BY table_name`
    );

    const tables: DynamicTable[] = [];
    for (const row of r.rows) {
      tables.push({
        name: row.table_name,
        columns: await this.getTableColumns(row.table_name),
        rowCount: Number(row.row_count),
      });
    }

    return tables;
  }

  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const r = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );

    return r.rows.map((row: any) => ({
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === "YES",
    }));
  }

  private calculateConfidence(values: number[]): number {
    if (values.length < 2) return 0.5;

    let mean = 0;
    for (const v of values) mean += v;
    mean /= values.length;

    if (mean === 0) return 0.5;

    let variance = 0;
    for (const v of values) variance += Math.pow(v - mean, 2);
    variance /= values.length;

    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    const confidence = 1.0 - Math.min(0.5, cv);
    return Math.max(0.5, Math.min(0.95, confidence));
  }

  private generateNaturalLanguageResponse(intent: QueryIntent, result: number): string {
    switch (intent.aggregation) {
      case "sum":
        if (intent.entityName) return `O total de vendas para ${intent.entityName} é R$ ${result.toFixed(2)}`;
        return `O total de vendas é R$ ${result.toFixed(2)}`;
      case "count":
        if (intent.entityName) return `Foram encontradas ${result} transações para ${intent.entityName}`;
        return `Foram encontradas ${result} transações no total`;
      case "avg":
        if (intent.entityName) return `O valor médio das vendas para ${intent.entityName} é R$ ${result.toFixed(2)}`;
        return `O valor médio das vendas é R$ ${result.toFixed(2)}`;
      default:
        return `Resultado da consulta: ${result.toFixed(2)}`;
    }
  }

  private formatMonth(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
}
