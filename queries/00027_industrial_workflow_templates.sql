-- Table: public.industrial_workflow_templates

-- DROP TABLE IF EXISTS public.industrial_workflow_templates;

CREATE TABLE IF NOT EXISTS public.industrial_workflow_templates
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    category character varying(100) COLLATE pg_catalog."default" NOT NULL,
    industry_sector character varying(100) COLLATE pg_catalog."default",
    structure_json jsonb NOT NULL,
    created_by character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT industrial_workflow_templates_pkey PRIMARY KEY (id),
    CONSTRAINT chk_industrial_templates_category CHECK (category::text = ANY (ARRAY['manufacturing'::character varying, 'production'::character varying, 'quality_control'::character varying, 'maintenance'::character varying, 'assembly'::character varying, 'packaging'::character varying, 'warehouse'::character varying, 'logistics'::character varying, 'supply_chain'::character varying, 'chemical'::character varying, 'pharmaceutical'::character varying, 'food_processing'::character varying, 'automotive'::character varying, 'aerospace'::character varying, 'electronics'::character varying, 'textile'::character varying, 'metalworking'::character varying, 'plastics'::character varying, 'printing'::character varying, 'renewable_energy'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.industrial_workflow_templates
    OWNER to postgres;
-- Index: idx_industrial_templates_category

-- DROP INDEX IF EXISTS public.idx_industrial_templates_category;

CREATE INDEX IF NOT EXISTS idx_industrial_templates_category
    ON public.industrial_workflow_templates USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_templates_created_at

-- DROP INDEX IF EXISTS public.idx_industrial_templates_created_at;

CREATE INDEX IF NOT EXISTS idx_industrial_templates_created_at
    ON public.industrial_workflow_templates USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_templates_industry_sector

-- DROP INDEX IF EXISTS public.idx_industrial_templates_industry_sector;

CREATE INDEX IF NOT EXISTS idx_industrial_templates_industry_sector
    ON public.industrial_workflow_templates USING btree
    (industry_sector COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_templates_name

-- DROP INDEX IF EXISTS public.idx_industrial_templates_name;

CREATE INDEX IF NOT EXISTS idx_industrial_templates_name
    ON public.industrial_workflow_templates USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_templates_structure_gin

-- DROP INDEX IF EXISTS public.idx_industrial_templates_structure_gin;

CREATE INDEX IF NOT EXISTS idx_industrial_templates_structure_gin
    ON public.industrial_workflow_templates USING gin
    (structure_json)
    TABLESPACE pg_default;