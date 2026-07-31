-- Table: public.accounting_workflow_templates

-- DROP TABLE IF EXISTS public.accounting_workflow_templates;

CREATE TABLE IF NOT EXISTS public.accounting_workflow_templates
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    category character varying(100) COLLATE pg_catalog."default" NOT NULL,
    tax_regime character varying(50) COLLATE pg_catalog."default",
    fiscal_period character varying(20) COLLATE pg_catalog."default",
    regulatory_body character varying(50) COLLATE pg_catalog."default",
    structure_json jsonb NOT NULL,
    created_by character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounting_workflow_templates_pkey PRIMARY KEY (id),
    CONSTRAINT chk_accounting_templates_category CHECK (category::text = ANY (ARRAY['bookkeeping'::character varying, 'tax_compliance'::character varying, 'auditing'::character varying, 'financial_reporting'::character varying, 'accounts_payable'::character varying, 'accounts_receivable'::character varying, 'payroll'::character varying, 'fiscal_obligations'::character varying, 'treasury'::character varying, 'budgeting'::character varying, 'cost_accounting'::character varying, 'asset_management'::character varying, 'tax_planning'::character varying, 'internal_controls'::character varying, 'reconciliation'::character varying, 'closing'::character varying, 'transfer_pricing'::character varying, 'tax_audit'::character varying, 'regulatory_compliance'::character varying, 'financial_analysis'::character varying]::text[])),
    CONSTRAINT chk_accounting_templates_fiscal_period CHECK (fiscal_period::text = ANY (ARRAY['monthly'::character varying, 'quarterly'::character varying, 'semester'::character varying, 'annual'::character varying, 'custom'::character varying]::text[])),
    CONSTRAINT chk_accounting_templates_tax_regime CHECK (tax_regime::text = ANY (ARRAY['simples_nacional'::character varying, 'lucro_presumido'::character varying, 'lucro_real'::character varying, 'mei'::character varying, 'international'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.accounting_workflow_templates
    OWNER to postgres;
-- Index: idx_accounting_templates_category

-- DROP INDEX IF EXISTS public.idx_accounting_templates_category;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_category
    ON public.accounting_workflow_templates USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_templates_created_at

-- DROP INDEX IF EXISTS public.idx_accounting_templates_created_at;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_created_at
    ON public.accounting_workflow_templates USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_templates_fiscal_period

-- DROP INDEX IF EXISTS public.idx_accounting_templates_fiscal_period;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_fiscal_period
    ON public.accounting_workflow_templates USING btree
    (fiscal_period COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_templates_name

-- DROP INDEX IF EXISTS public.idx_accounting_templates_name;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_name
    ON public.accounting_workflow_templates USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_templates_regulatory_body

-- DROP INDEX IF EXISTS public.idx_accounting_templates_regulatory_body;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_regulatory_body
    ON public.accounting_workflow_templates USING btree
    (regulatory_body COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_templates_structure_gin

-- DROP INDEX IF EXISTS public.idx_accounting_templates_structure_gin;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_structure_gin
    ON public.accounting_workflow_templates USING gin
    (structure_json)
    TABLESPACE pg_default;
-- Index: idx_accounting_templates_tax_regime

-- DROP INDEX IF EXISTS public.idx_accounting_templates_tax_regime;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_tax_regime
    ON public.accounting_workflow_templates USING btree
    (tax_regime COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;