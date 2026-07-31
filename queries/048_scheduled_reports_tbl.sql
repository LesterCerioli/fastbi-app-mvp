-- Table: public.scheduled_reports

-- DROP TABLE IF EXISTS public.scheduled_reports;

CREATE TABLE IF NOT EXISTS public.scheduled_reports
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    report_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    dataset_ids jsonb NOT NULL,
    analysis_config jsonb NOT NULL,
    schedule_cron character varying(100) COLLATE pg_catalog."default",
    recipients jsonb,
    last_run timestamp with time zone,
    next_run timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scheduled_reports_pkey PRIMARY KEY (id),
    CONSTRAINT scheduled_reports_report_id_key UNIQUE (report_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.scheduled_reports
    OWNER to postgres;
-- Index: idx_reports_active

-- DROP INDEX IF EXISTS public.idx_reports_active;

CREATE INDEX IF NOT EXISTS idx_reports_active
    ON public.scheduled_reports USING btree
    (is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_reports_next_run

-- DROP INDEX IF EXISTS public.idx_reports_next_run;

CREATE INDEX IF NOT EXISTS idx_reports_next_run
    ON public.scheduled_reports USING btree
    (next_run ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: update_scheduled_reports_updated_at

-- DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON public.scheduled_reports;

CREATE OR REPLACE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE 
    ON public.scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();