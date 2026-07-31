CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Chaves estrangeiras
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    sales_rep_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Dados da transação
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'refund', 'adjustment', 'subscription', 'one_time'
    invoice_number VARCHAR(100),
    
    -- Valores (suporte a múltiplas moedas)
    amount_usd DECIMAL(20,4) NOT NULL,  -- Sempre convertido para USD
    original_amount DECIMAL(20,4),
    original_currency VARCHAR(3),
    exchange_rate DECIMAL(10,6),
    
    -- Quantidade e preço unitário
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price_usd DECIMAL(20,4),
    
    -- Estrutura de custos detalhada
    cogs_direct_material DECIMAL(20,4) DEFAULT 0,  -- Matéria-prima direta
    cogs_direct_labor DECIMAL(20,4) DEFAULT 0,     -- Mão-de-obra direta
    cogs_manufacturing DECIMAL(20,4) DEFAULT 0,    -- Custos de fabricação
    cogs_freight_in DECIMAL(20,4) DEFAULT 0,       -- Frete de entrada
    cogs_royalties DECIMAL(20,4) DEFAULT 0,        -- Royalties
    
    -- Custos variáveis de venda
    variable_commission DECIMAL(20,4) DEFAULT 0,   -- Comissões de vendas
    variable_shipping DECIMAL(20,4) DEFAULT 0,     -- Frete de entrega
    variable_payment_fees DECIMAL(20,4) DEFAULT 0, -- Taxas de pagamento
    variable_packaging DECIMAL(20,4) DEFAULT 0,    -- Embalagem
    
    -- Custos fixos diretos (rateados)
    fixed_direct_allocated DECIMAL(20,4) DEFAULT 0,
    
    -- Cálculo do COGS total (pode ser pré-calculado ou calculado na query)
    total_cogs DECIMAL(20,4) GENERATED ALWAYS AS (
        cogs_direct_material + cogs_direct_labor + cogs_manufacturing + 
        cogs_freight_in + cogs_royalties + variable_commission + 
        variable_shipping + variable_payment_fees + variable_packaging
    ) STORED,
    
    -- Margem da transação (pré-calculada para performance)
    transaction_margin_percent DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN amount_usd > 0 
        THEN ((amount_usd - (cogs_direct_material + cogs_direct_labor + cogs_manufacturing + 
              cogs_freight_in + cogs_royalties + variable_commission + 
              variable_shipping + variable_payment_fees + variable_packaging)) / amount_usd) * 100
        ELSE 0 END
    ) STORED,
    
    -- Dimensões de negócio (cópia para performance e histórico)
    product_name VARCHAR(200),                      -- Cópia do nome do produto no momento da venda
    product_category VARCHAR(100),                 -- Cópia da categoria
    product_sku VARCHAR(100),                      -- Cópia do SKU
    
    customer_name VARCHAR(200),                    -- Cópia do nome do cliente
    customer_tier VARCHAR(50),                     -- 'enterprise', 'mid-market', 'small_business'
    
    region VARCHAR(100),
    state VARCHAR(50),
    city VARCHAR(100),
    
    channel VARCHAR(100), -- 'online', 'retail', 'direct_sales', 'partner', 'marketplace'
    sales_rep_name VARCHAR(200),
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL,
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL
);

-- Índices para performance analítica
CREATE INDEX idx_financial_transactions_org_date ON public.financial_transactions(organization_id, transaction_date);
CREATE INDEX idx_financial_transactions_product ON public.financial_transactions(organization_id, product_id);
CREATE INDEX idx_financial_transactions_customer ON public.financial_transactions(organization_id, customer_id);
CREATE INDEX idx_financial_transactions_region ON public.financial_transactions(organization_id, region);
CREATE INDEX idx_financial_transactions_channel ON public.financial_transactions(organization_id, channel);
CREATE INDEX idx_financial_transactions_margin ON public.financial_transactions(organization_id, transaction_margin_percent);