-- Table: public.report_jobs

-- DROP TABLE IF EXISTS public.report_jobs;

CREATE TABLE IF NOT EXISTS public.report_jobs
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    schedule_id uuid,
    template_id uuid,
    status report_job_status NOT NULL DEFAULT 'queued'::report_job_status,
    priority report_job_priority NOT NULL DEFAULT 'normal'::report_job_priority,
    attempt_count smallint NOT NULL DEFAULT 0,
    max_attempts smallint NOT NULL DEFAULT 3,
    next_retry_at timestamp with time zone,
    error_message text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT report_jobs_pkey PRIMARY KEY (id),
    CONSTRAINT report_jobs_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT report_jobs_schedule_id_fkey FOREIGN KEY (schedule_id)
        REFERENCES public.report_schedules (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT report_jobs_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.dashboard_templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_jobs
    OWNER to postgres;
-- Index: idx_report_jobs_dequeue

-- DROP INDEX IF EXISTS public.idx_report_jobs_dequeue;

CREATE INDEX IF NOT EXISTS idx_report_jobs_dequeue
    ON public.report_jobs USING btree
    (priority ASC NULLS LAST, created_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status = ANY (ARRAY['queued'::report_job_status, 'retrying'::report_job_status]);
-- Index: idx_report_jobs_dlq

-- DROP INDEX IF EXISTS public.idx_report_jobs_dlq;

CREATE INDEX IF NOT EXISTS idx_report_jobs_dlq
    ON public.report_jobs USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status = 'dead_lettered'::report_job_status;
-- Index: idx_report_jobs_org_status

-- DROP INDEX IF EXISTS public.idx_report_jobs_org_status;

CREATE INDEX IF NOT EXISTS idx_report_jobs_org_status
    ON public.report_jobs USING btree
    (organization_id ASC NULLS LAST, status ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_report_jobs_retry_due

-- DROP INDEX IF EXISTS public.idx_report_jobs_retry_due;

CREATE INDEX IF NOT EXISTS idx_report_jobs_retry_due
    ON public.report_jobs USING btree
    (next_retry_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status = 'retrying'::report_job_status;