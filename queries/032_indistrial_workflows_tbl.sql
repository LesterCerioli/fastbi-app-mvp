-- Table: public.industrial_workflows

-- DROP TABLE IF EXISTS public.industrial_workflows;

CREATE TABLE IF NOT EXISTS public.industrial_workflows
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    template_id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    structure_json jsonb NOT NULL,
    status character varying(50) COLLATE pg_catalog."default" DEFAULT 'active'::character varying,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT industrial_workflows_pkey PRIMARY KEY (id),
    CONSTRAINT industrial_workflows_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.industrial_workflow_templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE RESTRICT,
    CONSTRAINT chk_industrial_workflows_status CHECK (status::text = ANY (ARRAY['active'::character varying, 'paused'::character varying, 'completed'::character varying, 'archived'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.industrial_workflows
    OWNER to postgres;
-- Index: idx_industrial_workflows_created_at

-- DROP INDEX IF EXISTS public.idx_industrial_workflows_created_at;

CREATE INDEX IF NOT EXISTS idx_industrial_workflows_created_at
    ON public.industrial_workflows USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_workflows_organization_id

-- DROP INDEX IF EXISTS public.idx_industrial_workflows_organization_id;

CREATE INDEX IF NOT EXISTS idx_industrial_workflows_organization_id
    ON public.industrial_workflows USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_workflows_status

-- DROP INDEX IF EXISTS public.idx_industrial_workflows_status;

CREATE INDEX IF NOT EXISTS idx_industrial_workflows_status
    ON public.industrial_workflows USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_industrial_workflows_structure_gin

-- DROP INDEX IF EXISTS public.idx_industrial_workflows_structure_gin;

CREATE INDEX IF NOT EXISTS idx_industrial_workflows_structure_gin
    ON public.industrial_workflows USING gin
    (structure_json)
    TABLESPACE pg_default;
-- Index: idx_industrial_workflows_template_id

-- DROP INDEX IF EXISTS public.idx_industrial_workflows_template_id;

CREATE INDEX IF NOT EXISTS idx_industrial_workflows_template_id
    ON public.industrial_workflows USING btree
    (template_id ASC NULLS LAST)
    TABLESPACE pg_default;