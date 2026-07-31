-- Create enum types in public schema
CREATE TYPE public.kpi_category AS ENUM (
    'revenue_profitability', 'financial_health', 'growth_trends', 
    'customer_value', 'operational_efficiency', 'retention_expansion', 
    'forecasting_predictive'
);

CREATE TYPE public.kpi_unit AS ENUM (
    'percentage', 'currency', 'number', 'ratio', 'days', 'rating', 'boolean'
);

CREATE TYPE public.kpi_status AS ENUM (
    'active', 'inactive', 'deprecated', 'draft'
);

CREATE TYPE public.aggregation_type AS ENUM (
    'sum', 'avg', 'count', 'min', 'max', 'latest', 'weighted_avg', 'median'
);

CREATE TYPE public.comparison_operator AS ENUM (
    'greater_than', 'less_than', 'equal_to', 'greater_equal', 
    'less_equal', 'between'
);