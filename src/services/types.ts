export type Nullable<T> = T | null | undefined;

export interface OrganizationRow {
  id: string;
  name: string;
  address: string | null;
  cnpj: string | null;
  ein: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ClientConnectionRow {
  id: string;
  organization_id: string;
  connection_name: string;
  db_type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password_encrypted: string;
  ssl_mode: string;
  max_rows_limit: number;
  query_timeout_seconds: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_used_at: Date | null;
}

export interface AuthTokenRow {
  id: string;
  client_id: string;
  jwt_token: string;
  expires_at: Date;
  created_at: Date;
}

export interface SavedQueryRow {
  id: string;
  organization_id: string;
  connection_id: string;
  name: string;
  query_text: string;
  description: string | null;
  category: string | null;
  execution_count: number;
  last_executed_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardTemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  layout: any;
  widgets: any;
  tags: string[];
  thumbnail_url: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardRow {
  id: string;
  dashboard_id: string;
  organization_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  dataset_ids: any;
  layout: any;
  business_context: string | null;
  refresh_rate: string | null;
  is_public: boolean;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface DashboardWidgetRow {
  id: string;
  dashboard_id: string;
  organization_id: string;
  widget_type: string;
  title: string | null;
  description: string | null;
  kpi_id: string | null;
  config: any;
  position: any;
  size: any;
  refresh_interval: number;
  is_visible: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface KpiRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  aggregation_type: string;
  comparison_operator: string | null;
  target_value: number | null;
  warning_threshold: number | null;
  critical_threshold: number | null;
  formula: any | null;
  data_source: string | null;
  is_active: boolean;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface KpiValueRow {
  id: string;
  kpi_id: string;
  organization_id: string;
  value: number;
  calculated_at: Date;
  period_start: Date;
  period_end: Date;
  metadata: any;
  created_at: Date;
}

export interface AgentAnomalyRow {
  id: string;
  organization_id: string;
  metric_name: string;
  dimension_name: string | null;
  dimension_value: string | null;
  expected_value: number;
  actual_value: number;
  deviation_zscore: number;
  detected_at: Date;
}

export interface AgentInsightRow {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  confidence: number;
  metadata: any;
  created_at: Date;
}

export interface ReportRunRow {
  id: string;
  organization_id: string;
  schedule_id: string | null;
  job_id: string | null;
  status: string;
  current_stage: string;
  stage_started_at: Date;
  stage_metadata: any;
  created_at: Date;
  delivered_at: Date | null;
  error_details: string | null;
}

export interface ReportJobRow {
  id: string;
  organization_id: string;
  schedule_id: string | null;
  template_id: string | null;
  status: string;
  priority: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: Date | null;
  error_message: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}
