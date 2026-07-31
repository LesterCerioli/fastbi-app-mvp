-- Table: public.accounting_workflows

-- DROP TABLE IF EXISTS public.accounting_workflows;

CREATE TABLE IF NOT EXISTS public.accounting_workflows
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    template_id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    fiscal_year integer NOT NULL,
    fiscal_period character varying(20) COLLATE pg_catalog."default" NOT NULL,
    structure_json jsonb NOT NULL,
    status character varying(50) COLLATE pg_catalog."default" DEFAULT 'pending'::character varying,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounting_workflows_pkey PRIMARY KEY (id),
    CONSTRAINT accounting_workflows_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.accounting_workflow_templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE RESTRICT
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.accounting_workflows
    OWNER to postgres;
-- Index: idx_accounting_workflows_created_at

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_created_at;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_created_at
    ON public.accounting_workflows USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_fiscal_period

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_fiscal_period;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_fiscal_period
    ON public.accounting_workflows USING btree
    (fiscal_period COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_fiscal_year

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_fiscal_year;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_fiscal_year
    ON public.accounting_workflows USING btree
    (fiscal_year ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_org_fiscal

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_org_fiscal;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_org_fiscal
    ON public.accounting_workflows USING btree
    (organization_id ASC NULLS LAST, fiscal_year ASC NULLS LAST, fiscal_period COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_organization_id

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_organization_id;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_organization_id
    ON public.accounting_workflows USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_status

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_status;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_status
    ON public.accounting_workflows USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_structure_gin

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_structure_gin;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_structure_gin
    ON public.accounting_workflows USING gin
    (structure_json)
    TABLESPACE pg_default;
-- Index: idx_accounting_workflows_template_id

-- DROP INDEX IF EXISTS public.idx_accounting_workflows_template_id;

CREATE INDEX IF NOT EXISTS idx_accounting_workflows_template_id
    ON public.accounting_workflows USING btree
    (template_id ASC NULLS LAST)
    TABLESPACE pg_default;