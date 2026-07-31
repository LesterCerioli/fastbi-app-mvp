-- Table: public.sales_workflows

-- DROP TABLE IF EXISTS public.sales_workflows;

CREATE TABLE IF NOT EXISTS public.sales_workflows
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    structure_json jsonb NOT NULL,
    status character varying(50) COLLATE pg_catalog."default" DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sales_workflows_pkey PRIMARY KEY (id),
    CONSTRAINT chk_sales_workflows_status CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'archived'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sales_workflows
    OWNER to postgres;
-- Index: idx_sales_workflows_created_at

-- DROP INDEX IF EXISTS public.idx_sales_workflows_created_at;

CREATE INDEX IF NOT EXISTS idx_sales_workflows_created_at
    ON public.sales_workflows USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_workflows_organization_id

-- DROP INDEX IF EXISTS public.idx_sales_workflows_organization_id;

CREATE INDEX IF NOT EXISTS idx_sales_workflows_organization_id
    ON public.sales_workflows USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_workflows_status

-- DROP INDEX IF EXISTS public.idx_sales_workflows_status;

CREATE INDEX IF NOT EXISTS idx_sales_workflows_status
    ON public.sales_workflows USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;