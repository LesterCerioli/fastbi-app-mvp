-- Table: public.report_schedules

-- DROP TABLE IF EXISTS public.report_schedules;

CREATE TABLE IF NOT EXISTS public.report_schedules
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    template_id uuid,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    cron_expression character varying(100) COLLATE pg_catalog."default" NOT NULL,
    timezone character varying(100) COLLATE pg_catalog."default" NOT NULL DEFAULT 'UTC'::character varying,
    export_format character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pdf'::character varying,
    language character varying(10) COLLATE pg_catalog."default" NOT NULL DEFAULT 'en'::character varying,
    distribution_list_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    next_run_at timestamp with time zone,
    last_run_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT report_schedules_pkey PRIMARY KEY (id),
    CONSTRAINT report_schedules_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT report_schedules_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.report_templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_schedules
    OWNER to postgres;
-- Index: idx_report_schedules_active_next

-- DROP INDEX IF EXISTS public.idx_report_schedules_active_next;

CREATE INDEX IF NOT EXISTS idx_report_schedules_active_next
    ON public.report_schedules USING btree
    (is_active ASC NULLS LAST, next_run_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE is_active = true;
-- Index: idx_report_schedules_is_active

-- DROP INDEX IF EXISTS public.idx_report_schedules_is_active;

CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active
    ON public.report_schedules USING btree
    (is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_report_schedules_next_run_at

-- DROP INDEX IF EXISTS public.idx_report_schedules_next_run_at;

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at
    ON public.report_schedules USING btree
    (next_run_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE is_active = true;
-- Index: idx_report_schedules_org_id

-- DROP INDEX IF EXISTS public.idx_report_schedules_org_id;

CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id
    ON public.report_schedules USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_report_schedules_template_id

-- DROP INDEX IF EXISTS public.idx_report_schedules_template_id;

CREATE INDEX IF NOT EXISTS idx_report_schedules_template_id
    ON public.report_schedules USING btree
    (template_id ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE template_id IS NOT NULL;