CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Informações básicas
    sku VARCHAR(100) NOT NULL,                    -- Stock Keeping Unit
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Categorização
    product_category VARCHAR(100) NOT NULL,       -- ex: 'SaaS', 'Hardware', 'Service', 'License'
    product_subcategory VARCHAR(100),              -- ex: 'Enterprise', 'Basic', 'Premium'
    product_family VARCHAR(100),                   -- ex: 'Software Suite', 'Cloud Services'
    
    -- Classificações internas
    product_tier VARCHAR(50),                      -- 'basic', 'premium', 'enterprise', 'custom'
    lifecycle_stage VARCHAR(50) DEFAULT 'active', -- 'development', 'active', 'mature', 'declining', 'discontinued'
    
    -- Dados financeiros de referência
    standard_cost DECIMAL(20,4),                   -- Custo padrão unitário
    standard_price DECIMAL(20,4),                  -- Preço padrão unitário
    target_margin_percent DECIMAL(5,2),           -- Meta de margem para este produto
    
    -- Informações de custo
    cost_of_goods_sold DECIMAL(20,4),             -- Métrica pré-calculada se disponível
    cost_allocation_method VARCHAR(50) DEFAULT 'per_unit', -- 'per_unit', 'percentage', 'activity_based'
    
    -- Produtos relacionados
    parent_product_id UUID REFERENCES public.products(id),
    bundle_components JSONB,                       -- Lista de produtos que compõem este bundle
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT products_org_sku_unique UNIQUE (organization_id, sku)
);

-- Índices
CREATE INDEX idx_products_organization ON public.products(organization_id);
CREATE INDEX idx_products_category ON public.products(organization_id, product_category);
CREATE INDEX idx_products_lifecycle ON public.products(organization_id, lifecycle_stage);