import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DIST = path.join(process.cwd(), "node_modules/swagger-ui-dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".map": "application/json",
};

function checkAuth(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const user = process.env.SWAGGER_USER;
  const pass = process.env.SWAGGER_PASSWORD;
  if (!user || !pass) return false;

  try {
    const decoded = atob(authHeader.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) return false;
    return decoded.slice(0, colon) === user && decoded.slice(colon + 1) === pass;
  } catch {
    return false;
  }
}

function buildSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "FastBI App API",
      version: "1.0.0",
      description: "API for managing database connections, authentication, and business intelligence workflows.",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from POST /auth/token — pass as 'Authorization: Bearer <token>' header",
        },
      },
      parameters: {
        AuthorizationHeader: {
          name: "Authorization",
          in: "header",
          required: true,
          schema: { type: "string" },
          description: "Bearer <JWT token from POST /auth/token>",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "string" },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT token" },
          },
        },
        DashboardTemplate: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            layout: { type: "object" },
            widgets: { type: "array", items: { type: "object" } },
            tags: { type: "array", items: { type: "string" } },
            thumbnail_url: { type: "string" },
            is_active: { type: "boolean" },
            created_by: { type: "string", nullable: true },
            updated_by: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Dashboard: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            dashboard_id: { type: "string", description: "URL-friendly slug" },
            organization_id: { type: "string", format: "uuid" },
            template_id: { type: "string", format: "uuid", nullable: true },
            name: { type: "string" },
            description: { type: "string" },
            dataset_ids: { type: "array", items: { type: "object" } },
            layout: { type: "object" },
            business_context: { type: "string" },
            refresh_rate: { type: "string" },
            is_public: { type: "boolean" },
            is_default: { type: "boolean" },
            is_active: { type: "boolean" },
            created_by: { type: "string", nullable: true },
            updated_by: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            widgets: { type: "array", items: { $ref: "#/components/schemas/DashboardWidget" } },
          },
        },
        DashboardWidget: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            dashboard_id: { type: "string", format: "uuid" },
            organization_id: { type: "string", format: "uuid" },
            widget_type: { type: "string", enum: ["kpi_card", "bar_chart", "line_chart", "pie_chart", "table", "gauge", "heatmap", "text"] },
            title: { type: "string" },
            description: { type: "string" },
            kpi_id: { type: "string", format: "uuid", nullable: true },
            config: { type: "object" },
            position: { type: "object" },
            size: { type: "object" },
            refresh_interval: { type: "integer" },
            is_visible: { type: "boolean" },
            sort_order: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        ConnectionConfig: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            organization_id: { type: "string", format: "uuid" },
            organization_name: { type: "string" },
            connection_name: { type: "string" },
            db_type: { type: "string" },
            host: { type: "string" },
            port: { type: "integer" },
            database_name: { type: "string" },
            username: { type: "string" },
            ssl_mode: { type: "string" },
            max_rows_limit: { type: "integer" },
            query_timeout_seconds: { type: "integer" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            last_used_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        ConnectionListItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            connection_name: { type: "string" },
            db_type: { type: "string" },
            host: { type: "string" },
            port: { type: "integer" },
            database_name: { type: "string" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            last_used_at: { type: "string", format: "date-time", nullable: true },
            max_rows_limit: { type: "integer" },
            query_timeout_seconds: { type: "integer" },
          },
        },
        QueryResult: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            row_count: { type: "integer" },
            columns: { type: "array", items: { type: "string" } },
            data: { type: "array", items: { type: "object" } },
            query_executed: { type: "string" },
            connection_name: { type: "string" },
            organization_name: { type: "string" },
            db_type: { type: "string" },
            limit_applied: { type: "boolean" },
            max_limit: { type: "integer" },
            error: { type: "string" },
          },
        },
        TestResult: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            host: { type: "string" },
            port: { type: "integer" },
            database: { type: "string" },
            db_type: { type: "string" },
            error: { type: "string" },
          },
        },
        ConnectionStatistics: {
          type: "object",
          properties: {
            organization_name: { type: "string" },
            total_connections: { type: "integer" },
            active_last_30_days: { type: "integer" },
            never_used: { type: "integer" },
            average_row_limit: { type: "number" },
            average_timeout_seconds: { type: "number" },
          },
        },
        Organization: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            address: { type: "string", nullable: true },
            cnpj: { type: "string", nullable: true },
            ein: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        OrganizationDetail: {
          allOf: [
            { $ref: "#/components/schemas/Organization" },
            {
              type: "object",
              properties: {
                statistics: {
                  type: "object",
                  properties: {
                    user_count: { type: "integer" },
                  },
                },
              },
            },
          ],
        },
        OrganizationList: {
          type: "object",
          properties: {
            organizations: { type: "array", items: { $ref: "#/components/schemas/Organization" } },
            total_count: { type: "integer" },
            page: { type: "integer" },
            page_size: { type: "integer" },
            total_pages: { type: "integer" },
          },
        },
        CreateOrganizationRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            address: { type: "string" },
            cnpj: { type: "string" },
            ein: { type: "string" },
          },
        },
        UpdateOrganizationRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: { type: "string" },
            cnpj: { type: "string" },
            ein: { type: "string" },
          },
        },
        CNPJValidation: {
          type: "object",
          properties: {
            cnpj: { type: "string" },
            is_valid_format: { type: "boolean" },
            is_available: { type: "boolean" },
            cleaned_cnpj: { type: "string" },
          },
        },
        EINValidation: {
          type: "object",
          properties: {
            ein: { type: "string" },
            is_valid_format: { type: "boolean" },
            is_available: { type: "boolean" },
            cleaned_ein: { type: "string" },
          },
        },
        AccountingWorkflowTemplate: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            category: { type: "string" },
            tax_regime: { type: "string" },
            fiscal_period: { type: "string" },
            regulatory_body: { type: "string" },
            structure: { type: "object" },
            created_by: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        AccountingWorkflow: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            organization_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            template_id: { type: "string", format: "uuid" },
            fiscal_year: { type: "integer" },
            fiscal_period: { type: "string" },
            structure: { type: "object" },
            status: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        ComplianceCalendar: {
          type: "object",
          properties: {
            fiscal_year: { type: "integer" },
            organization_id: { type: "string" },
            obligations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template_name: { type: "string" },
                  category: { type: "string" },
                  fiscal_period: { type: "string" },
                  deadlines: { type: "object" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
        CreateAccountingTemplateRequest: {
          type: "object",
          required: ["name", "category", "structure"],
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            structure: { type: "object" },
            tax_regime: { type: "string" },
            fiscal_period: { type: "string" },
            regulatory_body: { type: "string" },
            created_by: { type: "string" },
          },
        },
        UpdateAccountingTemplateRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            structure: { type: "object" },
            tax_regime: { type: "string" },
            fiscal_period: { type: "string" },
          },
        },
        CreateWorkflowRequest: {
          type: "object",
          required: ["template_name", "template_category", "fiscal_year"],
          properties: {
            template_name: { type: "string" },
            template_category: { type: "string" },
            fiscal_year: { type: "integer" },
            fiscal_period: { type: "string" },
            name: { type: "string" },
            customization: { type: "object" },
          },
        },
        UserDTO: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440001" },
            organization_id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            role: { type: "string", example: "Doctor" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            deleted_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["organization_id", "name", "email", "role"],
          properties: {
            organization_id: { type: "string", format: "uuid", example: "123e4567-e89b-12d3-a456-426614174000" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            role: { type: "string", example: "Doctor" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            password: { type: "string", format: "password", example: "Str0ngP@ssw0rd" },
            role: { type: "string", example: "admin" },
          },
        },
        LoginByOrganizationRequest: {
          type: "object",
          required: ["email", "password", "organization_name"],
          properties: {
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            password: { type: "string", format: "password", example: "Str0ngP@ssw0rd" },
            organization_name: { type: "string", example: "MedCare Hospital" },
          },
        },
        LoginByRoleRequest: {
          type: "object",
          required: ["email", "password", "role"],
          properties: {
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            password: { type: "string", format: "password", example: "Str0ngP@ssw0rd" },
            role: { type: "string", example: "admin" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password", "role", "organization_name"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            password: { type: "string", format: "password", example: "Str0ngP@ssw0rd" },
            role: { type: "string", example: "Doctor" },
            organization_name: { type: "string", example: "MedCare Hospital" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["new_password"],
          properties: {
            new_password: { type: "string", format: "password", example: "NewStr0ngP@ssw0rd" },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["new_password"],
          properties: {
            new_password: { type: "string", format: "password", example: "NewStr0ngP@ssw0rd" },
          },
        },
        ResetPasswordConfirmRequest: {
          type: "object",
          required: ["token", "newPassword", "confirmPassword"],
          properties: {
            token: { type: "string", description: "Reset token from email link" },
            newPassword: { type: "string", format: "password", example: "NewStr0ngP@ssw0rd" },
            confirmPassword: { type: "string", format: "password", example: "NewStr0ngP@ssw0rd" },
          },
        },
        RevenueInsightsResponse: {
          type: "object",
          properties: {
            organization_name: { type: "string" },
            period_analyzed: { type: "object", properties: { start_date: { type: "string", nullable: true }, end_date: { type: "string", nullable: true } } },
            key_metrics: { type: "object", properties: { total_revenue: { type: "number" }, total_quantity: { type: "number" }, avg_transaction_value: { type: "number" }, total_transactions: { type: "number" } } },
            all_sales: { type: "array", items: { type: "object" } },
          },
        },
        ForecastResponse: {
          type: "object",
          properties: {
            organization_name: { type: "string" },
            historical_data: { type: "array", items: { type: "object" } },
            forecast: { type: "array", items: { type: "object" } },
            seasonal_indices: { type: "object" },
            average_monthly_revenue: { type: "number" },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
        ExpansionOpportunitiesResponse: {
          type: "array",
          items: { type: "object" },
        },
        ProductMixResponse: {
          type: "object",
          properties: {
            detailed_analysis: { type: "array", items: { type: "object" } },
            summary: { type: "object" },
            actionable_insights: { type: "array", items: { type: "string" } },
          },
        },
        SeasonalityRequest: {
          type: "object",
          required: ["organization_name"],
          properties: {
            organization_name: { type: "string" },
            granularity: { type: "string", enum: ["month", "quarter"], default: "month" },
            compare_years: { type: "array", items: { type: "integer" } },
          },
        },
        SeasonalityAnalysisResponse: {
          type: "object",
          properties: {
            seasonalPatterns: { type: "object" },
            peakPeriods: { type: "array", items: { type: "object" } },
            lowPeriods: { type: "array", items: { type: "object" } },
            yearOverYearChange: { type: "object" },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
        GrowthRequest: {
          type: "object",
          required: ["organization_name", "start_date", "end_date"],
          properties: {
            organization_name: { type: "string" },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            interval: { type: "string", enum: ["day", "week", "month", "quarter"], default: "month" },
            include_cagr: { type: "boolean", default: true },
          },
        },
        GrowthAnalysisResponse: {
          type: "object",
          properties: {
            absoluteGrowth: { type: "number" },
            percentageGrowth: { type: "number" },
            periodBreakdown: { type: "array", items: { type: "object" } },
            cagr: { type: "number" },
            growthRate: { type: "number" },
            trendDirection: { type: "string" },
            volatility: { type: "number" },
          },
        },
        PeriodComparisonRequest: {
          type: "object",
          required: ["organization_name", "period1", "period2"],
          properties: {
            organization_name: { type: "string" },
            period1: { type: "object", properties: { label: { type: "string" }, start_date: { type: "string", format: "date" }, end_date: { type: "string", format: "date" } } },
            period2: { type: "object", properties: { label: { type: "string" }, start_date: { type: "string", format: "date" }, end_date: { type: "string", format: "date" } } },
            group_by: { type: "string", default: "category" },
          },
        },
        PeriodComparisonResponse: {
          type: "object",
          properties: {
            period1: { type: "object" },
            period2: { type: "object" },
            absoluteDifference: { type: "number" },
            percentageDifference: { type: "number" },
            segmentedComparison: { type: "object" },
            insights: { type: "array", items: { type: "string" } },
          },
        },
        ExecutiveSummaryRequest: {
          type: "object",
          required: ["organization_name"],
          properties: {
            organization_name: { type: "string" },
            current_date: { type: "string", format: "date" },
            lookback_days: { type: "integer", default: 90 },
          },
        },
        ExecutiveSummaryResponse: {
          type: "object",
          properties: {
            currentPeriod: { type: "object" },
            growthIndicators: { type: "object" },
            seasonalAlert: { type: "object" },
            topOpportunities: { type: "array", items: { type: "object" } },
            riskFactors: { type: "array", items: { type: "object" } },
            executiveRecommendations: { type: "array", items: { type: "string" } },
          },
        },
        EffectivePatternsResponse: {
          type: "object",
          properties: {
            patterns: { type: "array", items: { type: "object" } },
            generated_at: { type: "string", format: "date-time" },
          },
        },
        EffectivenessRankingResponse: {
          type: "object",
          properties: {
            rankings: { type: "array", items: { type: "object" } },
            generated_at: { type: "string", format: "date-time" },
          },
        },
        AnomalyDistributionResponse: {
          type: "object",
          properties: {
            buckets: { type: "array", items: { type: "object" } },
            total_open: { type: "integer" },
            generated_at: { type: "string", format: "date-time" },
          },
        },
        LearningConfidenceResponse: {
          type: "object",
          properties: {
            buckets: { type: "array", items: { type: "object" } },
            overall_avg_confidence: { type: "number" },
            generated_at: { type: "string", format: "date-time" },
          },
        },
        HealthScoreResponse: {
          type: "object",
          properties: {
            organization_name: { type: "string" },
            health_score: { type: "number" },
            last_total_revenue: { type: "number" },
            last_total_transactions: { type: "number" },
            last_avg_margin: { type: "number" },
            analysis_date: { type: "string", format: "date-time" },
            insights_generated: { type: "integer" },
            risks_identified: { type: "integer" },
          },
        },
        ActiveInsightSummaryResponse: {
          type: "object",
          properties: {
            organization_name: { type: "string" },
            by_severity: { type: "array", items: { type: "object" } },
            total_active: { type: "integer" },
            generated_at: { type: "string", format: "date-time" },
          },
        },
        KPIResponse: {
          type: "object",
          properties: {
            code: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            unit: { type: "string" },
            aggregation: { type: "string" },
            target_value: { type: "number", nullable: true },
            target_min: { type: "number", nullable: true },
            target_max: { type: "number", nullable: true },
            comparison_operator: { type: "string" },
            alert_threshold: { type: "number", nullable: true },
            alert_enabled: { type: "boolean" },
            alert_severity: { type: "string", nullable: true },
            calculation_query: { type: "string" },
            reporting_period: { type: "string" },
            lookback_days: { type: "integer" },
            applicable_regions: { type: "array", items: { type: "string" } },
            applicable_departments: { type: "array", items: { type: "string" } },
            applicable_business_units: { type: "array", items: { type: "string" } },
            required_roles: { type: "array", items: { type: "string" } },
            status: { type: "string" },
            version: { type: "integer" },
            created_by: { type: "string", nullable: true },
            updated_by: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            last_calculated_at: { type: "string", format: "date-time", nullable: true },
            last_value: { type: "number", nullable: true },
            last_variance_percentage: { type: "number", nullable: true },
          },
        },
        KPIListResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/KPIResponse" } },
            total: { type: "integer" },
          },
        },
        CreateKPIRequest: {
          type: "object",
          required: ["organization_name", "code", "name", "category", "unit", "aggregation", "comparison_operator", "alert_enabled", "reporting_period", "lookback_days"],
          properties: {
            organization_name: { type: "string" },
            code: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            unit: { type: "string" },
            aggregation: { type: "string" },
            target_value: { type: "number", nullable: true },
            target_min: { type: "number", nullable: true },
            target_max: { type: "number", nullable: true },
            comparison_operator: { type: "string" },
            alert_threshold: { type: "number", nullable: true },
            alert_enabled: { type: "boolean" },
            alert_severity: { type: "string", nullable: true },
            calculation_query: { type: "string" },
            depends_on: { type: "array", items: { type: "string" } },
            reporting_period: { type: "string" },
            lookback_days: { type: "integer" },
            applicable_regions: { type: "array", items: { type: "string" } },
            applicable_departments: { type: "array", items: { type: "string" } },
            applicable_business_units: { type: "array", items: { type: "string" } },
            required_roles: { type: "array", items: { type: "string" } },
            created_by: { type: "string" },
          },
        },
        UpdateKPIRequest: {
          type: "object",
          required: ["organization_name"],
          properties: {
            organization_name: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            unit: { type: "string" },
            aggregation: { type: "string" },
            target_value: { type: "number", nullable: true },
            target_min: { type: "number", nullable: true },
            target_max: { type: "number", nullable: true },
            comparison_operator: { type: "string" },
            alert_threshold: { type: "number", nullable: true },
            alert_enabled: { type: "boolean" },
            alert_severity: { type: "string", nullable: true },
            calculation_query: { type: "string" },
            depends_on: { type: "array", items: { type: "string" } },
            reporting_period: { type: "string" },
            lookback_days: { type: "integer" },
            applicable_regions: { type: "array", items: { type: "string" } },
            applicable_departments: { type: "array", items: { type: "string" } },
            applicable_business_units: { type: "array", items: { type: "string" } },
            required_roles: { type: "array", items: { type: "string" } },
            status: { type: "string" },
            updated_by: { type: "string" },
            change_reason: { type: "string" },
          },
        },
        KPIHistoryEntry: {
          type: "object",
          properties: {
            version: { type: "integer" },
            changed_at: { type: "string", format: "date-time" },
            change_reason: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            target_value: { type: "number", nullable: true },
            status: { type: "string" },
            changed_by: { type: "string", nullable: true },
          },
        },
        KPIHistoryResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/KPIHistoryEntry" } },
            total: { type: "integer" },
            code: { type: "string" },
          },
        },
        ExecutiveRevenueReportResponse: {
          type: "object",
          properties: {
            report_type: { type: "string" },
            period: { type: "string" },
            date_range: { type: "object" },
            global_revenue: { type: "number" },
            yoy_growth: { type: "number" },
            revenue_by_region: { type: "object" },
            revenue_by_business_unit: { type: "object" },
            growth_rate: { type: "number" },
            is_sustainable: { type: "boolean" },
            top_customers: { type: "array", items: { type: "object" } },
            alerts: { type: "array", items: { type: "object" } },
            time_series: { type: "array", items: { type: "object" } },
            comparison: { type: "object" },
          },
        },
        RegionalRevenueReportResponse: {
          type: "object",
          properties: {
            report_type: { type: "string" },
            region: { type: "string" },
            period: { type: "string" },
            total_revenue: { type: "number" },
            yoy_growth: { type: "number" },
            customer_count: { type: "integer" },
            avg_revenue_per_customer: { type: "number" },
            top_products: { type: "object" },
            top_customers: { type: "array", items: { type: "object" } },
            time_series: { type: "array", items: { type: "object" } },
            alerts: { type: "array", items: { type: "object" } },
          },
        },
        GeneralFile: {
          type: "object",
          properties: {
            id: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            file_name: { type: "string" },
            s3_key: { type: "string" },
            bucket_name: { type: "string" },
            file_size: { type: "integer" },
            file_extension: { type: "string" },
            row_count: { type: "integer" },
            columns: { type: "array", items: { type: "string" } },
            status: { type: "string" },
            error: { type: "string" },
            truncated: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Workflow: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            organization_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", example: "draft" },
            definition: { type: "object" },
            steps: { type: "array", items: { type: "object" } },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        WorkflowTemplate: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            organization_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            category: { type: "string", nullable: true },
            definition: { type: "object" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/auth/token": {
        post: {
          tags: ["Auth"],
          summary: "Generate JWT token",
          description: "Authenticate with client_id and secret to obtain a JWT token for subsequent API calls.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client_id: { type: "string", description: "Client ID (defaults to CLIENT_ID_1 env)" },
                    secret: { type: "string", description: "Secret (defaults to SECRET_1 env)" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Token generated successfully",
              content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } },
            },
            "400": {
              description: "Missing client_id or secret",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "401": {
              description: "Invalid client_id or secret",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/auth/resetpassword": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset",
          description: "Sends a password reset email with a link (expires in 10 minutes) to set a new password.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email", example: "john.doe@example.com" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Reset email sent",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Email is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/resetpassword/confirm": {
        post: {
          tags: ["Auth"],
          summary: "Confirm password reset",
          description: "Set a new password using the reset token sent via email. The token expires in 10 minutes.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResetPasswordConfirmRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Password changed successfully" },
            "400": { description: "Missing or invalid fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "410": { description: "Invalid or expired reset token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/external": {
        post: {
          tags: ["External Auth"],
          summary: "Generate external API token",
          description: "Generate a token for authentication with external FastBI APIs.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["client_id", "secret"],
                  properties: {
                    client_id: { type: "string", description: "External API client ID" },
                    secret: { type: "string", description: "External API secret" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Token generated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string", description: "Generated token" },
                      client_id: { type: "string", description: "Client ID" },
                      expires_at: { type: "string", description: "Token expiration time" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing client_id or secret", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "500": { description: "Failed to generate token", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/validate": {
        post: {
          tags: ["Auth"],
          summary: "Validate JWT token",
          description: "Check whether a JWT token is still valid and not expired.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "JWT token to validate" },
                  },
                  required: ["token"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Token is valid",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      status: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Token is required",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "401": {
              description: "Invalid or expired token",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/dashboards": {
        get: {
          tags: ["Dashboards"],
          summary: "List organization dashboards",
          description: "Retrieve all dashboards for an organization, with optional filters.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "organization_name",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Organization name",
            },
            {
              name: "is_active",
              in: "query",
              required: false,
              schema: { type: "boolean" },
            },
            {
              name: "business_context",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "List of dashboards",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Dashboard" } },
                      total: { type: "integer" },
                      organization_name: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Dashboards"],
          summary: "Create a dashboard",
          description: "Create a new dashboard for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "organization_name"],
                  properties: {
                    organization_name: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    template_name: { type: "string", description: "Template name to clone widgets from" },
                    dataset_ids: { type: "array", items: { type: "object" } },
                    layout: { type: "object" },
                    business_context: { type: "string" },
                    refresh_rate: { type: "string" },
                    is_public: { type: "boolean", default: false },
                    is_default: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Dashboard created", content: { "application/json": { schema: { $ref: "#/components/schemas/Dashboard" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization or template not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboards/templates": {
        get: {
          tags: ["Dashboard Templates"],
          summary: "List dashboard templates",
          description: "Retrieve all dashboard templates with optional filters.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "is_active",
              in: "query",
              required: false,
              schema: { type: "boolean" },
            },
            {
              name: "tag",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20 },
            },
            {
              name: "offset",
              in: "query",
              required: false,
              schema: { type: "integer", default: 0 },
            },
          ],
          responses: {
            "200": {
              description: "List of templates",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/DashboardTemplate" } },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
        post: {
          tags: ["Dashboard Templates"],
          summary: "Create a dashboard template",
          description: "Create a new global dashboard template.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    layout: { type: "object" },
                    widgets: { type: "array", items: { type: "object" } },
                    tags: { type: "array", items: { type: "string" } },
                    thumbnail_url: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Template created", content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardTemplate" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboards/templates/{name}": {
        get: {
          tags: ["Dashboard Templates"],
          summary: "Get template by name",
          description: "Retrieve a single dashboard template by its name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Template name",
            },
          ],
          responses: {
            "200": { description: "Template details", content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardTemplate" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Dashboard Templates"],
          summary: "Update template",
          description: "Update an existing dashboard template identified by name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Template name",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    layout: { type: "object" },
                    widgets: { type: "array", items: { type: "object" } },
                    tags: { type: "array", items: { type: "string" } },
                    thumbnail_url: { type: "string" },
                    is_active: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Template updated", content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardTemplate" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Dashboard Templates"],
          summary: "Deactivate template",
          description: "Soft-delete (deactivate) a dashboard template by name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Template name",
            },
          ],
          responses: {
            "200": { description: "Template deactivated" },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboards/{slug}": {
        get: {
          tags: ["Dashboards"],
          summary: "Get dashboard by slug",
          description: "Retrieve a single dashboard by its URL-friendly slug (dashboard_id).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
          ],
          responses: {
            "200": { description: "Dashboard details", content: { "application/json": { schema: { $ref: "#/components/schemas/Dashboard" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Dashboards"],
          summary: "Update dashboard",
          description: "Update an existing dashboard identified by slug.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    dataset_ids: { type: "array", items: { type: "object" } },
                    layout: { type: "object" },
                    business_context: { type: "string" },
                    refresh_rate: { type: "string" },
                    is_public: { type: "boolean" },
                    is_default: { type: "boolean" },
                    is_active: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Dashboard updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Dashboard" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Dashboards"],
          summary: "Delete dashboard",
          description: "Soft-delete a dashboard by slug (sets deleted_at).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
          ],
          responses: {
            "200": { description: "Dashboard deleted" },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboards/{slug}/widgets": {
        get: {
          tags: ["Dashboard Widgets"],
          summary: "List widgets",
          description: "Retrieve all widgets for a dashboard.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
          ],
          responses: {
            "200": {
              description: "List of widgets",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/DashboardWidget" } },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Dashboard Widgets"],
          summary: "Add widget",
          description: "Add a new widget to a dashboard.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["widget_type"],
                  properties: {
                    widget_type: { type: "string", enum: ["kpi_card", "bar_chart", "line_chart", "pie_chart", "table", "gauge", "heatmap", "text"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    kpi_id: { type: "string", format: "uuid" },
                    config: { type: "object" },
                    position: { type: "object" },
                    size: { type: "object" },
                    refresh_interval: { type: "integer", default: 300 },
                    sort_order: { type: "integer", default: 0 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Widget created", content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardWidget" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboards/{slug}/widgets/{widget_title}": {
        put: {
          tags: ["Dashboard Widgets"],
          summary: "Update widget",
          description: "Update a widget identified by title within a dashboard.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
            {
              name: "widget_title",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Widget title",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    widget_type: { type: "string", enum: ["kpi_card", "bar_chart", "line_chart", "pie_chart", "table", "gauge", "heatmap", "text"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    kpi_id: { type: "string", format: "uuid" },
                    config: { type: "object" },
                    position: { type: "object" },
                    size: { type: "object" },
                    refresh_interval: { type: "integer" },
                    is_visible: { type: "boolean" },
                    sort_order: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Widget updated", content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardWidget" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard or widget not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Dashboard Widgets"],
          summary: "Delete widget",
          description: "Delete a widget identified by title within a dashboard.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Dashboard slug (dashboard_id)",
            },
            {
              name: "widget_title",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Widget title",
            },
          ],
          responses: {
            "200": { description: "Widget deleted" },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Dashboard or widget not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dataeng/clientconn": {
        get: {
          tags: ["Client Connections"],
          summary: "Get connection(s)",
          description: "Retrieve a connection config by ID, list connections by organization, get statistics, or resolve a connection name to ID. Requires Authorization: Bearer header.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "connection_id",
              in: "query",
              required: false,
              schema: { type: "string", format: "uuid" },
              description: "Connection ID to fetch full config",
            },
            {
              name: "organization_name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Organization name to list connections",
            },
            {
              name: "action",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["statistics", "name"] },
              description: "Use 'statistics' with organization_name, or 'name' with organization_name + connection_name",
            },
            {
              name: "connection_name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Connection name (required when action=name)",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ConnectionConfig" },
                      { $ref: "#/components/schemas/ConnectionListItem" },
                      { $ref: "#/components/schemas/ConnectionStatistics" },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Missing required parameter",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "404": {
              description: "Connection not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
        post: {
          tags: ["Client Connections"],
          summary: "Register connection, execute query, or test connection",
          description: "Authorization: Bearer header. Action determines the operation: default creates a new connection, action=query executes a SELECT, action=test pings the connection.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    action: { type: "string", enum: ["query", "test"], description: "Omit to register a new connection" },
                    organization_name: { type: "string" },
                    connection_name: { type: "string" },
                    host: { type: "string" },
                    port: { type: "integer" },
                    database_name: { type: "string" },
                    username: { type: "string" },
                    password: { type: "string" },
                    db_type: { type: "string", enum: ["postgresql", "postgres", "mysql", "mariadb", "sqlserver", "mssql", "oracle"], default: "postgresql" },
                    ssl_mode: { type: "string", default: "require" },
                    max_rows_limit: { type: "integer", default: 10000 },
                    query_timeout_seconds: { type: "integer", default: 30 },
                    connection_id: { type: "string", format: "uuid", description: "Required for action=query or action=test" },
                    query: { type: "string", description: "SQL SELECT query (required for action=query)" },
                    params: { type: "array", items: { type: "string" }, description: "Query parameters (optional)" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Query or test result",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/QueryResult" },
                      { $ref: "#/components/schemas/TestResult" },
                    ],
                  },
                },
              },
            },
            "201": {
              description: "Connection registered",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ConnectionConfig" } } },
            },
            "400": {
              description: "Bad request",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
        delete: {
          tags: ["Client Connections"],
          summary: "Delete (deactivate) a connection",
          description: "Soft-deletes a connection by setting is_active = false. Requires Authorization: Bearer header.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "connection_id",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Connection ID to delete",
            },
          ],
          responses: {
            "200": {
              description: "Connection deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      connection_id: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Missing connection_id",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "404": {
              description: "Connection not found or already inactive",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/dataeng/generalfiles": {
        get: {
          tags: ["Data Engineering"],
          summary: "Get general file(s)",
          description: "Retrieve a single general file by ID, or list all general files for an organization. Requires Authorization: Bearer header.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "id",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "File ID to fetch a single general file",
            },
            {
              name: "organization_name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Organization name to list its general files",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/GeneralFile" },
                      { type: "array", items: { $ref: "#/components/schemas/GeneralFile" } },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Missing organization_name or id",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "404": {
              description: "Organization or file not found",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/organizations": {
        get: {
          tags: ["Organizations"],
          summary: "List or search organizations",
          description: "Retrieve all organizations (paginated), search by name or tax ID, or validate CNPJ/EIN.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", default: 1 },
            },
            {
              name: "page_size",
              in: "query",
              required: false,
              schema: { type: "integer", default: 100 },
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Full-text search across name, address, CNPJ, and EIN",
            },
            {
              name: "q",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "ILIKE search by organization name",
            },
            {
              name: "cnpj",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Lookup by CNPJ (exact match)",
            },
            {
              name: "ein",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Lookup by EIN (exact match)",
            },
            {
              name: "action",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["validate-cnpj", "validate-ein"] },
              description: "Use with cnpj or ein to validate format and availability",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/OrganizationList" },
                      { $ref: "#/components/schemas/Organization" },
                      { $ref: "#/components/schemas/CNPJValidation" },
                      { $ref: "#/components/schemas/EINValidation" },
                    ],
                  },
                },
              },
            },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Organizations"],
          summary: "Create organization",
          description: "Create a new organization with optional CNPJ/EIN.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateOrganizationRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Organization created", content: { "application/json": { schema: { $ref: "#/components/schemas/Organization" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "409": { description: "CNPJ or EIN already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/organizations/{name}": {
        get: {
          tags: ["Organizations"],
          summary: "Get organization by name",
          description: "Retrieve a single organization by its name, with optional statistics.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Organization name",
            },
            {
              name: "action",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["statistics"] },
              description: "Include organization statistics",
            },
          ],
          responses: {
            "200": { description: "Organization details", content: { "application/json": { schema: { $ref: "#/components/schemas/OrganizationDetail" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Organizations"],
          summary: "Update organization",
          description: "Update an existing organization identified by name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Organization name",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateOrganizationRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Organization updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Organization" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "409": { description: "CNPJ or EIN already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Organizations"],
          summary: "Delete, deactivate, or reactivate organization",
          description: "Soft-delete an organization by name. Use action=deactivate or action=reactivate for explicit deactivation/reactivation.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Organization name",
            },
            {
              name: "action",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["deactivate", "reactivate"] },
              description: "Explicit deactivate or reactivate instead of full delete",
            },
          ],
          responses: {
            "200": { description: "Organization deleted/deactivated/reactivated" },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users": {
        get: {
          tags: ["Users"],
          summary: "Get Users by date",
          description: "Retrieve users by creation or update date. Use ?date=YYYY-MM-DD and optionally &type=updated.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "date",
              in: "query",
              required: true,
              schema: { type: "string", format: "date" },
              description: "Date in YYYY-MM-DD format",
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["created", "updated"] },
              description: "Filter by created (default) or updated date",
            },
          ],
          responses: {
            "200": {
              description: "List of users",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserDTO" } } } },
            },
            "400": { description: "Invalid or missing date parameter", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "No users found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create User",
          description: "Create a new user without password (for SSO/admin creation).",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserRequest" } } },
          },
          responses: {
            "201": {
              description: "User created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid request body or missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "409": { description: "Email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/email/{email}": {
        get: {
          tags: ["Users"],
          summary: "Get Users by Email",
          description: "Retrieve users by email address.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "email", in: "path", required: true, schema: { type: "string" }, description: "User email" },
          ],
          responses: {
            "200": {
              description: "List of users",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserDTO" } } } },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "No users found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/name/{name}": {
        get: {
          tags: ["Users"],
          summary: "Get Users by Name",
          description: "Retrieve users by name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "name", in: "path", required: true, schema: { type: "string" }, description: "User name" },
          ],
          responses: {
            "200": {
              description: "List of users",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserDTO" } } } },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "No users found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/role/{role}": {
        get: {
          tags: ["Users"],
          summary: "Get Users by Role",
          description: "Retrieve users by role.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "role", in: "path", required: true, schema: { type: "string" }, description: "User role" },
          ],
          responses: {
            "200": {
              description: "List of users",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserDTO" } } } },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "No users found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/login": {
        post: {
          tags: ["Users"],
          summary: "User Login",
          description: "Authenticate a user with email and password. If role is provided, validates the user's role.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: { $ref: "#/components/schemas/UserDTO" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Invalid email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/login/organization": {
        post: {
          tags: ["Users"],
          summary: "User Login by Organization",
          description: "Authenticate a user within a specific organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginByOrganizationRequest" } } },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: { $ref: "#/components/schemas/UserDTO" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Invalid email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/login/role": {
        post: {
          tags: ["Users"],
          summary: "User Login by Role",
          description: "Authenticate a user and validate their role.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginByRoleRequest" } } },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: { $ref: "#/components/schemas/UserDTO" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Invalid email, password or role", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/register": {
        post: {
          tags: ["Users"],
          summary: "Register User",
          description: "Register a new user with password using organization name.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
          },
          responses: {
            "201": {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: { $ref: "#/components/schemas/UserDTO" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "409": { description: "Email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/{email}/change-password": {
        post: {
          tags: ["Users"],
          summary: "Change User Password",
          description: "Change password for a specific user by email.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "email", in: "path", required: true, schema: { type: "string", format: "email" }, description: "User email" },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } } },
          },
          responses: {
            "200": { description: "Password changed successfully" },
            "400": { description: "Missing or invalid fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/users/{email}/reset-password": {
        post: {
          tags: ["Users"],
          summary: "Reset User Password",
          description: "Reset password for a user by email.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "email", in: "path", required: true, schema: { type: "string", format: "email" }, description: "User email" },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } },
          },
          responses: {
            "200": { description: "Password reset successfully" },
            "400": { description: "Missing or invalid fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/templates": {
        get: {
          tags: ["Accounting Workflow"],
          summary: "List accounting workflow templates",
          description: "Retrieve all accounting workflow templates, optionally filtered by category or tax regime.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Filter by category",
            },
            {
              name: "tax_regime",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Filter by tax regime",
            },
          ],
          responses: {
            "200": {
              description: "List of templates",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } } } },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Accounting Workflow"],
          summary: "Create accounting workflow template",
          description: "Create a new accounting workflow template with stages, KPIs, and compliance settings.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAccountingTemplateRequest" } } },
          },
          responses: {
            "201": { description: "Template created", content: { "application/json": { schema: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/templates/category/{category}": {
        get: {
          tags: ["Accounting Workflow"],
          summary: "Get templates by category",
          description: "Retrieve accounting workflow templates filtered by category.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "category",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Accounting category",
            },
          ],
          responses: {
            "200": {
              description: "List of templates",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } } } },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/templates/tax-regime/{tax_regime}": {
        get: {
          tags: ["Accounting Workflow"],
          summary: "Get templates by tax regime",
          description: "Retrieve accounting workflow templates filtered by tax regime.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "tax_regime",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Tax regime",
            },
          ],
          responses: {
            "200": {
              description: "List of templates",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } } } },
            },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/templates/{name}": {
        put: {
          tags: ["Accounting Workflow"],
          summary: "Update template",
          description: "Update an existing accounting workflow template identified by name and category.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Template name",
            },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAccountingTemplateRequest" } } },
          },
          responses: {
            "200": { description: "Template updated", content: { "application/json": { schema: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/workflows": {
        post: {
          tags: ["Accounting Workflow"],
          summary: "Create workflow from template",
          description: "Create a new accounting workflow instance from an existing template. The organization is resolved from the current session cookie (set by POST /api/session/init after login).",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkflowRequest" } } },
          },
          responses: {
            "201": { description: "Workflow created", content: { "application/json": { schema: { $ref: "#/components/schemas/AccountingWorkflow" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/workflows/{fiscal_year}": {
        get: {
          tags: ["Accounting Workflow"],
          summary: "Get workflows by fiscal period",
          description: "Retrieve workflows for the current session organization, filtered by fiscal year. Requires calling POST /api/session/init first.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "fiscal_year",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Fiscal year",
            },
            {
              name: "fiscal_period",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Optional fiscal period filter",
            },
          ],
          responses: {
            "200": {
              description: "List of workflows",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AccountingWorkflow" } } } } } },
            },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow/compliance-calendar/{fiscal_year}": {
        get: {
          tags: ["Accounting Workflow"],
          summary: "Get compliance calendar",
          description: "Retrieve compliance calendar obligations for the current session organization in a fiscal year. Requires calling POST /api/session/init first.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "fiscal_year",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Fiscal year",
            },
          ],
          responses: {
            "200": { description: "Compliance calendar", content: { "application/json": { schema: { $ref: "#/components/schemas/ComplianceCalendar" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/accountingworkflow": {
        get: {
          tags: ["Accounting Workflow"],
          summary: "List accounting workflow templates",
          description: "Retrieve all accounting workflow templates, optionally filtered by category or tax regime. Alias for GET /accountingworkflow/templates.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Filter by category",
            },
            {
              name: "tax_regime",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Filter by tax regime",
            },
          ],
          responses: {
            "200": {
              description: "List of templates",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } } } },
            },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Accounting Workflow"],
          summary: "Create accounting workflow template",
          description: "Create a new accounting workflow template with stages, KPIs, and compliance settings. Alias for POST /accountingworkflow/templates.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAccountingTemplateRequest" } } },
          },
          responses: {
            "201": { description: "Template created", content: { "application/json": { schema: { $ref: "#/components/schemas/AccountingWorkflowTemplate" } } } },
            "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/sales/revenue-insights": {
        get: {
          tags: ["Dashboard Sales Analytics"],
          summary: "Get revenue insights",
          description: "Retrieve revenue insights for an organization with optional date range, category, and region filters.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "start_date", in: "query", required: false, schema: { type: "string", format: "date" } },
            { name: "end_date", in: "query", required: false, schema: { type: "string", format: "date" } },
            { name: "category", in: "query", required: false, schema: { type: "string" } },
            { name: "region", in: "query", required: false, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Revenue insights", content: { "application/json": { schema: { $ref: "#/components/schemas/RevenueInsightsResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/sales/forecast": {
        get: {
          tags: ["Dashboard Sales Analytics"],
          summary: "Forecast revenue",
          description: "Generate revenue forecast for an organization based on historical data.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "months_ahead", in: "query", required: false, schema: { type: "integer", default: 3 } },
            { name: "include_external_factors", in: "query", required: false, schema: { type: "boolean" } },
          ],
          responses: {
            "200": { description: "Revenue forecast", content: { "application/json": { schema: { $ref: "#/components/schemas/ForecastResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/sales/expansion-opportunities": {
        get: {
          tags: ["Dashboard Sales Analytics"],
          summary: "Get expansion opportunities",
          description: "Identify regions with high growth potential for expansion.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "min_revenue_threshold", in: "query", required: false, schema: { type: "number", default: 5000 } },
          ],
          responses: {
            "200": { description: "Expansion opportunities", content: { "application/json": { schema: { $ref: "#/components/schemas/ExpansionOpportunitiesResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/sales/product-mix": {
        get: {
          tags: ["Dashboard Sales Analytics"],
          summary: "Optimize product mix",
          description: "Analyze product category performance to optimize product mix.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "start_date", in: "query", required: false, schema: { type: "string", format: "date" } },
            { name: "end_date", in: "query", required: false, schema: { type: "string", format: "date" } },
          ],
          responses: {
            "200": { description: "Product mix analysis", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductMixResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/executive/seasonality": {
        post: {
          tags: ["Dashboard Executive Analytics"],
          summary: "Compare seasonality",
          description: "Analyze seasonal sales patterns across years for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SeasonalityRequest" } } } },
          responses: {
            "200": { description: "Seasonality analysis", content: { "application/json": { schema: { $ref: "#/components/schemas/SeasonalityAnalysisResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/executive/growth": {
        post: {
          tags: ["Dashboard Executive Analytics"],
          summary: "Calculate growth",
          description: "Calculate revenue growth over a period with optional CAGR and interval breakdown.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/GrowthRequest" } } } },
          responses: {
            "200": { description: "Growth analysis", content: { "application/json": { schema: { $ref: "#/components/schemas/GrowthAnalysisResponse" } } } },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/executive/period-comparison": {
        post: {
          tags: ["Dashboard Executive Analytics"],
          summary: "Compare periods",
          description: "Compare sales performance between two time periods with optional segment breakdown.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PeriodComparisonRequest" } } } },
          responses: {
            "200": { description: "Period comparison", content: { "application/json": { schema: { $ref: "#/components/schemas/PeriodComparisonResponse" } } } },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/analytics/executive/summary": {
        post: {
          tags: ["Dashboard Executive Analytics"],
          summary: "Get executive summary",
          description: "Generate an executive summary with growth indicators, seasonal alerts, opportunities, and risks.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ExecutiveSummaryRequest" } } } },
          responses: {
            "200": { description: "Executive summary", content: { "application/json": { schema: { $ref: "#/components/schemas/ExecutiveSummaryResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/insights/agent/effective-patterns": {
        get: {
          tags: ["Dashboard Agent Insights"],
          summary: "Get effective patterns",
          description: "Retrieve top effective agent patterns for an organization, ranked by effectiveness score.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
          ],
          responses: {
            "200": { description: "Effective patterns", content: { "application/json": { schema: { $ref: "#/components/schemas/EffectivePatternsResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/insights/agent/effectiveness-ranking": {
        get: {
          tags: ["Dashboard Agent Insights"],
          summary: "Get insight effectiveness ranking",
          description: "Retrieve global ranking of insight types by effectiveness score.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          responses: {
            "200": { description: "Effectiveness ranking", content: { "application/json": { schema: { $ref: "#/components/schemas/EffectivenessRankingResponse" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/insights/agent/anomaly-distribution": {
        get: {
          tags: ["Dashboard Agent Insights"],
          summary: "Get anomaly severity distribution",
          description: "Retrieve distribution of agent anomalies by severity for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
          ],
          responses: {
            "200": { description: "Anomaly distribution", content: { "application/json": { schema: { $ref: "#/components/schemas/AnomalyDistributionResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/insights/agent/learning-confidence": {
        get: {
          tags: ["Dashboard Agent Insights"],
          summary: "Get learning pattern confidence",
          description: "Retrieve global distribution of learning pattern confidence scores.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          responses: {
            "200": { description: "Learning confidence distribution", content: { "application/json": { schema: { $ref: "#/components/schemas/LearningConfidenceResponse" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/insights/agent/health-score": {
        get: {
          tags: ["Dashboard Agent Insights"],
          summary: "Get organization health score",
          description: "Retrieve the health score and latest metrics for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
          ],
          responses: {
            "200": { description: "Health score", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthScoreResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/insights/agent/active-summary": {
        get: {
          tags: ["Dashboard Agent Insights"],
          summary: "Get active insight summary",
          description: "Retrieve a summary of active agent insights grouped by severity for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
          ],
          responses: {
            "200": { description: "Active insight summary", content: { "application/json": { schema: { $ref: "#/components/schemas/ActiveInsightSummaryResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/kpis": {
        get: {
          tags: ["Dashboard KPIs"],
          summary: "List KPIs",
          description: "Retrieve all KPIs for an organization with optional filters.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "category", in: "query", required: false, schema: { type: "string" } },
            { name: "status", in: "query", required: false, schema: { type: "string" } },
            { name: "code", in: "query", required: false, schema: { type: "string" } },
            { name: "name", in: "query", required: false, schema: { type: "string" } },
            { name: "reporting_period", in: "query", required: false, schema: { type: "string" } },
            { name: "alert_enabled", in: "query", required: false, schema: { type: "boolean" } },
            { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } },
            { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": { description: "List of KPIs", content: { "application/json": { schema: { $ref: "#/components/schemas/KPIListResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Dashboard KPIs"],
          summary: "Create KPI",
          description: "Create a new KPI for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateKPIRequest" } } } },
          responses: {
            "201": { description: "KPI created", content: { "application/json": { schema: { $ref: "#/components/schemas/KPIResponse" } } } },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/kpis/{code}": {
        get: {
          tags: ["Dashboard KPIs"],
          summary: "Get KPI by code",
          description: "Retrieve a single KPI by its code for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "code", in: "path", required: true, schema: { type: "string" }, description: "KPI code" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
          ],
          responses: {
            "200": { description: "KPI details", content: { "application/json": { schema: { $ref: "#/components/schemas/KPIResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "KPI or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Dashboard KPIs"],
          summary: "Update KPI",
          description: "Update an existing KPI identified by code.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "code", in: "path", required: true, schema: { type: "string" }, description: "KPI code" },
          ],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateKPIRequest" } } } },
          responses: {
            "200": { description: "KPI updated", content: { "application/json": { schema: { $ref: "#/components/schemas/KPIResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "KPI or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Dashboard KPIs"],
          summary: "Delete KPI",
          description: "Soft-delete (archive) a KPI by code for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "code", in: "path", required: true, schema: { type: "string" }, description: "KPI code" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
          ],
          responses: {
            "200": { description: "KPI deleted" },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "KPI or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/kpis/{code}/history": {
        get: {
          tags: ["Dashboard KPIs"],
          summary: "Get KPI history",
          description: "Retrieve the change history for a KPI by code.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "code", in: "path", required: true, schema: { type: "string" }, description: "KPI code" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": { description: "KPI history", content: { "application/json": { schema: { $ref: "#/components/schemas/KPIHistoryResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "KPI or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/kpis/revenue/executive": {
        get: {
          tags: ["Dashboard KPIs"],
          summary: "Get executive revenue report",
          description: "Retrieve an executive-level revenue report with regional breakdown and growth metrics.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "period", in: "query", required: false, schema: { type: "string", enum: ["daily", "weekly", "monthly", "quarterly", "yearly"], default: "monthly" } },
          ],
          responses: {
            "200": { description: "Executive revenue report", content: { "application/json": { schema: { $ref: "#/components/schemas/ExecutiveRevenueReportResponse" } } } },
            "400": { description: "Missing organization_name", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/kpis/revenue/regional": {
        get: {
          tags: ["Dashboard KPIs"],
          summary: "Get regional revenue report",
          description: "Retrieve a revenue report filtered by region for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" }, description: "Organization name" },
            { name: "region", in: "query", required: true, schema: { type: "string" }, description: "Region name" },
            { name: "period", in: "query", required: false, schema: { type: "string", enum: ["daily", "weekly", "monthly", "quarterly", "yearly"], default: "monthly" } },
          ],
          responses: {
            "200": { description: "Regional revenue report", content: { "application/json": { schema: { $ref: "#/components/schemas/RegionalRevenueReportResponse" } } } },
            "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/session/init": {
        post: {
          tags: ["Session"],
          summary: "Initialize organization session",
          description: "Called after login to set an httpOnly cookie with the organization name. The cookie is used by GET /api/dashboard/overview to determine the current organization context.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["organization_id"],
                  properties: {
                    organization_id: { type: "string", format: "uuid", description: "Organization UUID returned from login" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Session initialized",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      organization_name: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing organization_id", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/session/organization": {
        get: {
          tags: ["Session"],
          summary: "Get current session organization",
          description: "Returns the organization name stored in the current httpOnly session cookie (set by POST /api/session/init).",
          responses: {
            "200": {
              description: "Current session organization",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      organization_name: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Organization not set in session", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboard/overview": {
        get: {
          tags: ["Dashboard Overview"],
          summary: "Get dashboard overview",
          description: "Returns consolidated dashboard card data (revenue, customers, orders, growth) for the current organization session. Requires calling POST /api/session/init first.",
          responses: {
            "200": {
              description: "Dashboard overview",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      organization_name: { type: "string" },
                      revenue: { type: "number", nullable: true },
                      total_transactions: { type: "integer", nullable: true },
                      growth: { type: "number", nullable: true },
                      customers: { type: "integer", nullable: true },
                      details: {
                        type: "object",
                        properties: {
                          revenue: { type: "object", nullable: true },
                          executive_summary: { type: "object", nullable: true },
                          kpi_revenue: { type: "object", nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Session not initialized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/dashboard/live-metrics": {
        get: {
          tags: ["Dashboard"],
          summary: "Get live metrics",
          description: "Returns real-time animated dashboard data (KPI achievement, growth, alerts, executive summary) for the current organization session. Requires calling POST /api/session/init first.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          responses: {
            "200": {
              description: "Live metrics data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      organization_name: { type: "string" },
                      bars: {
                        type: "object",
                        properties: {
                          revenue_percent: { type: "number", nullable: true },
                          customers_percent: { type: "number", nullable: true },
                          orders_percent: { type: "number", nullable: true },
                        },
                      },
                      growth: {
                        type: "object",
                        properties: {
                          mom_growth: { type: "number", nullable: true },
                          daily_growth: { type: "number", nullable: true },
                          vs_previous_percent: { type: "number", nullable: true },
                        },
                      },
                      executive_summary: { type: "object", nullable: true },
                      kpi_values: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            code: { type: "string" },
                            name: { type: "string" },
                            actual: { type: "number" },
                            target: { type: "number" },
                            variance: { type: "number" },
                            achieved: { type: "boolean" },
                          },
                        },
                      },
                      alerts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            type: { type: "string" },
                            severity: { type: "string" },
                            title: { type: "string" },
                            description: { type: "string" },
                            confidence: { type: "number" },
                            created_at: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Session not initialized" },
          },
        },
      },
      "/dashboard/alerts": {
        get: {
          tags: ["Dashboard"],
          summary: "List dashboard alerts",
          description: "Returns non-dismissed insights/alerts for the current organization session.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          responses: {
            "200": {
              description: "Alerts list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      organization_name: { type: "string" },
                      alerts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            type: { type: "string" },
                            severity: { type: "string" },
                            title: { type: "string" },
                            description: { type: "string" },
                            confidence: { type: "number" },
                            created_at: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Session not initialized" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Authenticate user credentials",
          description: "Validates email, password and role. Requires a valid JWT token obtained from POST /auth/token first.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "role"],
                  properties: {
                    email: { type: "string", format: "email", example: "john.doe@example.com" },
                    password: { type: "string", format: "password", example: "mypassword" },
                    role: { type: "string", example: "Software Engineer" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: { type: "object" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing fields" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/config": {
        get: {
          tags: ["Config"],
          summary: "Get API configuration endpoints",
          description: "Returns the configured API endpoint URLs for auth, login, and reset password.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          responses: {
            "200": {
              description: "Configuration object",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      authTokenEndpoint: { type: "string" },
                      loginEndpoint: { type: "string" },
                      resetPasswordEndpoint: { type: "string" },
                      baseUrl: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/dashboards": {
        get: {
          tags: ["Dashboards"],
          summary: "List dashboards",
          description: "Lists dashboards for an organization with optional filters.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", required: true, schema: { type: "string" } },
            { name: "is_active", in: "query", schema: { type: "boolean" } },
            { name: "business_context", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "offset", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            "200": { description: "Dashboard list" },
            "400": { description: "organization_name is required" },
          },
        },
        post: {
          tags: ["Dashboards"],
          summary: "Create dashboard",
          description: "Creates a new dashboard for an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "organization_name"],
                  properties: {
                    name: { type: "string" },
                    organization_name: { type: "string" },
                    description: { type: "string" },
                    template_name: { type: "string" },
                    dataset_ids: { type: "array", items: { type: "string" } },
                    layout: { type: "object" },
                    business_context: { type: "string" },
                    refresh_rate: { type: "integer" },
                    is_public: { type: "boolean" },
                    is_default: { type: "boolean" },
                    created_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Dashboard created" },
          },
        },
      },
      "/dashboards/templates": {
        get: {
          tags: ["Dashboards"],
          summary: "List dashboard templates",
          description: "Lists available dashboard templates with optional filters.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "is_active", in: "query", schema: { type: "boolean" } },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "offset", in: "query", schema: { type: "integer" } },
          ],
          responses: {
            "200": { description: "Template list" },
          },
        },
        post: {
          tags: ["Dashboards"],
          summary: "Create dashboard template",
          description: "Creates a new dashboard template.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    layout: { type: "object" },
                    widgets: { type: "array", items: { type: "object" } },
                    tags: { type: "array", items: { type: "string" } },
                    thumbnail_url: { type: "string" },
                    created_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Template created" },
          },
        },
      },
      "/dashboards/templates/{name}": {
        get: {
          tags: ["Dashboards"],
          summary: "Get dashboard template by name",
          description: "Retrieves a single dashboard template by its name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "name", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Template object" },
            "404": { description: "Template not found" },
          },
        },
        put: {
          tags: ["Dashboards"],
          summary: "Update dashboard template",
          description: "Updates an existing dashboard template by name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "name", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    layout: { type: "object" },
                    widgets: { type: "array", items: { type: "object" } },
                    tags: { type: "array", items: { type: "string" } },
                    thumbnail_url: { type: "string" },
                    is_active: { type: "boolean" },
                    updated_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Template updated" },
            "404": { description: "Template not found" },
          },
        },
        delete: {
          tags: ["Dashboards"],
          summary: "Deactivate dashboard template",
          description: "Deactivates (soft-deletes) a dashboard template by name.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "name", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Template deactivated" },
            "404": { description: "Template not found" },
          },
        },
      },
      "/dashboards/{slug}": {
        get: {
          tags: ["Dashboards"],
          summary: "Get dashboard by slug",
          description: "Retrieves a single dashboard by its URL-friendly slug.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Dashboard object" },
            "404": { description: "Dashboard not found" },
          },
        },
        put: {
          tags: ["Dashboards"],
          summary: "Update dashboard",
          description: "Updates an existing dashboard by slug.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    dataset_ids: { type: "array", items: { type: "string" } },
                    layout: { type: "object" },
                    business_context: { type: "string" },
                    refresh_rate: { type: "integer" },
                    is_public: { type: "boolean" },
                    is_default: { type: "boolean" },
                    is_active: { type: "boolean" },
                    updated_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Dashboard updated" },
            "404": { description: "Dashboard not found" },
          },
        },
        delete: {
          tags: ["Dashboards"],
          summary: "Delete dashboard",
          description: "Hard-deletes a dashboard by slug.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Dashboard deleted" },
            "404": { description: "Dashboard not found" },
          },
        },
      },
      "/dashboards/{slug}/widgets": {
        get: {
          tags: ["Dashboards"],
          summary: "List dashboard widgets",
          description: "Lists all widgets for a dashboard identified by slug.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Widget list" },
            "404": { description: "Dashboard not found" },
          },
        },
        post: {
          tags: ["Dashboards"],
          summary: "Add widget to dashboard",
          description: "Adds a new widget to a dashboard.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["widget_type"],
                  properties: {
                    organization_name: { type: "string" },
                    widget_type: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    kpi_id: { type: "string" },
                    config: { type: "object" },
                    position: { type: "object" },
                    size: { type: "object" },
                    refresh_interval: { type: "integer" },
                    sort_order: { type: "integer" },
                    created_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Widget created" },
            "404": { description: "Dashboard not found" },
          },
        },
      },
      "/dashboards/{slug}/widgets/{widget_title}": {
        put: {
          tags: ["Dashboards"],
          summary: "Update dashboard widget",
          description: "Updates an existing widget on a dashboard by its title.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            { name: "widget_title", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    widget_type: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    kpi_id: { type: "string" },
                    config: { type: "object" },
                    position: { type: "object" },
                    size: { type: "object" },
                    refresh_interval: { type: "integer" },
                    is_visible: { type: "boolean" },
                    sort_order: { type: "integer" },
                    updated_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Widget updated" },
            "404": { description: "Dashboard or widget not found" },
          },
        },
        delete: {
          tags: ["Dashboards"],
          summary: "Delete dashboard widget",
          description: "Removes a widget from a dashboard by its title.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            { name: "widget_title", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Widget deleted" },
            "404": { description: "Dashboard or widget not found" },
          },
        },
      },
      "/kpis": {
        get: {
          tags: ["KPIs"],
          summary: "List KPIs",
          description: "Lists all KPIs with optional filters (organization_name, category, code, status, etc.).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "organization_name", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "code", in: "query", schema: { type: "string" } },
            { name: "name", in: "query", schema: { type: "string" } },
            { name: "reporting_period", in: "query", schema: { type: "string" } },
            { name: "applicable_region", in: "query", schema: { type: "string" } },
            { name: "alert_enabled", in: "query", schema: { type: "boolean" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "offset", in: "query", schema: { type: "integer" } },
            { name: "order_by", in: "query", schema: { type: "string" } },
            { name: "order_dir", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: {
            "200": { description: "KPI list" },
          },
        },
        post: {
          tags: ["KPIs"],
          summary: "Create KPI",
          description: "Creates a new KPI definition.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["organization_name", "code", "name"],
                  properties: {
                    organization_name: { type: "string" },
                    code: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    unit: { type: "string" },
                    aggregation: { type: "string" },
                    target_value: { type: "number" },
                    target_min: { type: "number" },
                    target_max: { type: "number" },
                    comparison_operator: { type: "string" },
                    alert_threshold: { type: "number" },
                    alert_enabled: { type: "boolean" },
                    alert_severity: { type: "string" },
                    calculation_query: { type: "string" },
                    calculation_schema: { type: "object" },
                    depends_on: { type: "array", items: { type: "string" } },
                    reporting_period: { type: "string" },
                    lookback_days: { type: "integer" },
                    applicable_regions: { type: "array", items: { type: "string" } },
                    applicable_departments: { type: "array", items: { type: "string" } },
                    applicable_business_units: { type: "array", items: { type: "string" } },
                    required_roles: { type: "array", items: { type: "string" } },
                    view_permissions: { type: "object" },
                    created_by: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "KPI created" },
            "404": { description: "Organization not found" },
          },
        },
      },
      "/users": {
        get: {
          tags: ["Users"],
          summary: "List users by date",
          description: "Queries users by creation or update date. Requires `date` and optional `type=updated` query params.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "date", in: "query", required: true, schema: { type: "string", format: "date", example: "2024-01-15" } },
            { name: "type", in: "query", schema: { type: "string", enum: ["created", "updated"], default: "created" } },
          ],
          responses: {
            "200": { description: "User list" },
            "400": { description: "Invalid date format" },
            "404": { description: "No users found" },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create user",
          description: "Creates a new user under an organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "role", "organization_id"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    role: { type: "string" },
                    organization_id: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "User created" },
            "409": { description: "Email already exists" },
          },
        },
      },
      "/users/profile": {
        patch: {
          tags: ["Users"],
          summary: "Update user profile",
          description: "Updates a user's name and role by userId.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId"],
                  properties: {
                    userId: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Profile updated" },
            "400": { description: "userId is required" },
          },
        },
      },
      "/users/avatar": {
        get: {
          tags: ["Users"],
          summary: "Get user avatar URL",
          description: "Retrieves the avatar URL for a user by userId.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            { name: "userId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": { description: "Avatar URL" },
            "400": { description: "userId is required" },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Upload user avatar",
          description: "Uploads an avatar image for a user and stores it in S3.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "userId"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    userId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Avatar uploaded" },
            "400": { description: "File and userId are required" },
          },
        },
      },
      "/reports": {
        get: {
          tags: ["Reports"],
          summary: "Get report execution overview",
          description: "Returns consolidated report execution analytics (status distribution, failure rates, bottlenecks, delivery trend, activity metrics) for the current organization session. Requires calling POST /api/session/init first.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          responses: {
            "200": {
              description: "Report execution overview",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      organizationName: { type: "string" },
                      statusDistribution: { type: "object" },
                      failureRates: { type: "object" },
                      bottleneckAnalysis: { type: "object" },
                      deliveryTrend: { type: "object" },
                      activityMetrics: { type: "object" },
                    },
                  },
                },
              },
            },
            "400": { description: "Session not initialized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/workflows": {
        get: {
          tags: ["Workflows"],
          summary: "List or get a workflow",
          description: "List all workflows for the current session organization, or retrieve a single workflow by its id (via ?id=).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "id",
              in: "query",
              required: false,
              schema: { type: "string", format: "uuid" },
              description: "Workflow ID to fetch a single workflow",
            },
          ],
          responses: {
            "200": {
              description: "Workflow(s)",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/Workflow" },
                      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Workflow" } } } },
                    ],
                  },
                },
              },
            },
            "400": { description: "Session not initialized or bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Workflow or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Workflows"],
          summary: "Create workflow",
          description: "Create a new workflow for the current session organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "definition"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    definition: { type: "object" },
                    steps: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Workflow created", content: { "application/json": { schema: { $ref: "#/components/schemas/Workflow" } } } },
            "400": { description: "Session not initialized or missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Workflows"],
          summary: "Update workflow",
          description: "Update an existing workflow identified by its id in the request body.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string" },
                    definition: { type: "object" },
                    steps: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Workflow updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Workflow" } } } },
            "400": { description: "Session not initialized or id is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Workflow or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Workflows"],
          summary: "Delete workflow",
          description: "Delete a workflow by its id (?id=).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Workflow ID to delete",
            },
          ],
          responses: {
            "200": {
              description: "Workflow deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Session not initialized or id is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Workflow or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/workflows/templates": {
        get: {
          tags: ["Workflows"],
          summary: "List or get a workflow template",
          description: "List all workflow templates for the current session organization, or retrieve a single template by its id (via ?id=).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "id",
              in: "query",
              required: false,
              schema: { type: "string", format: "uuid" },
              description: "Template ID to fetch a single template",
            },
          ],
          responses: {
            "200": {
              description: "Template(s)",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/WorkflowTemplate" },
                      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/WorkflowTemplate" } } } },
                    ],
                  },
                },
              },
            },
            "400": { description: "Session not initialized or bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Workflows"],
          summary: "Create workflow template",
          description: "Save a workflow definition as a reusable template for the current session organization.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "definition"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    definition: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Template created", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkflowTemplate" } } } },
            "400": { description: "Session not initialized or missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Workflows"],
          summary: "Update workflow template",
          description: "Update an existing workflow template identified by its id in the request body.",
          security: [{ BearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/AuthorizationHeader" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    definition: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Template updated", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkflowTemplate" } } } },
            "400": { description: "Session not initialized or id is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Workflows"],
          summary: "Delete workflow template",
          description: "Delete a workflow template by its id (?id=).",
          security: [{ BearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/AuthorizationHeader" },
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Template ID to delete",
            },
          ],
          responses: {
            "200": {
              description: "Template deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Session not initialized or id is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "403": { description: "Access denied", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "404": { description: "Template or organization not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
    },
  };
}

function serveIndex() {
  const template = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");

  const html = template
    .replace('href="./swagger-ui.css"', 'href="/api/docs/swagger-ui.css"')
    .replace('href="index.css"', 'href="/api/docs/index.css"')
    .replace('href="./favicon-32x32.png"', 'href="/api/docs/favicon-32x32.png"')
    .replace('href="./favicon-16x16.png"', 'href="/api/docs/favicon-16x16.png"')
    .replace('src="./swagger-ui-bundle.js"', 'src="/api/docs/swagger-ui-bundle.js"')
    .replace('src="./swagger-ui-standalone-preset.js"', 'src="/api/docs/swagger-ui-standalone-preset.js"')
    .replace('src="./swagger-initializer.js"', 'src="/api/docs/swagger-initializer.js"');

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request, { params }) {
  if (!checkAuth(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Swagger Docs"' },
    });
  }

  const { slug } = await params;

  if (!slug || slug.length === 0 || slug[0] === "") {
    return serveIndex();
  }

  if (slug[0] === "spec.json") {
    return NextResponse.json(buildSpec());
  }

  const fileName = slug[slug.length - 1];
  const filePath = path.join(DIST, fileName);
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let content = fs.readFileSync(filePath);
  let contentType = MIME[ext] || "application/octet-stream";

  if (fileName === "swagger-initializer.js") {
    const specUrl = "/api/docs/spec.json";
    content = Buffer.from(
      content
        .toString()
        .replace('"https://petstore.swagger.io/v2/swagger.json"', `"${specUrl}"`),
    );
  }

  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

export async function POST() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
