-- Table: public.sales_workflow_templates

-- DROP TABLE IF EXISTS public.sales_workflow_templates;

CREATE TABLE IF NOT EXISTS public.sales_workflow_templates
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    category character varying(50) COLLATE pg_catalog."default" NOT NULL,
    structure_json jsonb NOT NULL,
    created_by character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sales_workflow_templates_pkey PRIMARY KEY (id),
    CONSTRAINT unique_template_name_category UNIQUE (name, category),
    CONSTRAINT chk_sales_workflow_templates_category CHECK (category::text = ANY (ARRAY['b2b'::character varying, 'b2c'::character varying, 'saas'::character varying, 'enterprise'::character varying, 'startup'::character varying, 'ecommerce'::character varying, 'consulting'::character varying, 'agency'::character varying, 'fintech'::character varying, 'healthcare'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sales_workflow_templates
    OWNER to postgres;
-- Index: idx_sales_workflow_templates_category

-- DROP INDEX IF EXISTS public.idx_sales_workflow_templates_category;

CREATE INDEX IF NOT EXISTS idx_sales_workflow_templates_category
    ON public.sales_workflow_templates USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_workflow_templates_created_at

-- DROP INDEX IF EXISTS public.idx_sales_workflow_templates_created_at;

CREATE INDEX IF NOT EXISTS idx_sales_workflow_templates_created_at
    ON public.sales_workflow_templates USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_workflow_templates_name

-- DROP INDEX IF EXISTS public.idx_sales_workflow_templates_name;

CREATE INDEX IF NOT EXISTS idx_sales_workflow_templates_name
    ON public.sales_workflow_templates USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;