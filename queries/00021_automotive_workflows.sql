-- Table: public.automotive_workflows

-- DROP TABLE IF EXISTS public.automotive_workflows;

CREATE TABLE IF NOT EXISTS public.automotive_workflows
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    template_id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    vehicle_id uuid,
    customer_id uuid,
    rental_start_date timestamp with time zone,
    rental_end_date timestamp with time zone,
    structure_json jsonb NOT NULL,
    status character varying(50) COLLATE pg_catalog."default" DEFAULT 'active'::character varying,
    completion_notes text COLLATE pg_catalog."default",
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT automotive_workflows_pkey PRIMARY KEY (id),
    CONSTRAINT automotive_workflows_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.automotive_workflow_templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE RESTRICT,
    CONSTRAINT chk_automotive_workflows_status CHECK (status::text = ANY (ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'overdue'::character varying, 'pending'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.automotive_workflows
    OWNER to postgres;
-- Index: idx_automotive_workflows_created_at

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_created_at;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_created_at
    ON public.automotive_workflows USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_customer_id

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_customer_id;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_customer_id
    ON public.automotive_workflows USING btree
    (customer_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_org_dates

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_org_dates;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_org_dates
    ON public.automotive_workflows USING btree
    (organization_id ASC NULLS LAST, rental_start_date ASC NULLS LAST, rental_end_date ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_org_status

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_org_status;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_org_status
    ON public.automotive_workflows USING btree
    (organization_id ASC NULLS LAST, status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_organization_id

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_organization_id;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_organization_id
    ON public.automotive_workflows USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_rental_dates

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_rental_dates;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_rental_dates
    ON public.automotive_workflows USING btree
    (rental_start_date ASC NULLS LAST, rental_end_date ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_status

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_status;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_status
    ON public.automotive_workflows USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_structure_gin

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_structure_gin;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_structure_gin
    ON public.automotive_workflows USING gin
    (structure_json)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_template_id

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_template_id;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_template_id
    ON public.automotive_workflows USING btree
    (template_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_workflows_vehicle_id

-- DROP INDEX IF EXISTS public.idx_automotive_workflows_vehicle_id;

CREATE INDEX IF NOT EXISTS idx_automotive_workflows_vehicle_id
    ON public.automotive_workflows USING btree
    (vehicle_id ASC NULLS LAST)
    TABLESPACE pg_default;