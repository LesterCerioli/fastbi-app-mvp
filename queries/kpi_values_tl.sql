CREATE TABLE public.kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actual_value DECIMAL(20,4) NOT NULL,
    target_value DECIMAL(20,4),
    variance_percentage DECIMAL(10,2),
    achieved_target BOOLEAN,
    calculation_date DATE NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Context dimensions for drill-down
    region VARCHAR(100),
    department VARCHAR(100),
    business_unit VARCHAR(100),
    product_line VARCHAR(100),
    customer_segment VARCHAR(100),
    
    -- Additional metadata
    calculation_context JSONB,
    data_quality_score DECIMAL(5,2),
    notes TEXT
);