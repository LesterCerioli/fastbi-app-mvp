-- Table: public.export_jobs

-- DROP TABLE IF EXISTS public.export_jobs;

CREATE TABLE IF NOT EXISTS public.export_jobs
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    filename character varying(255) COLLATE pg_catalog."default" NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'pending'::character varying,
    error_message text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    record_count integer,
    CONSTRAINT export_jobs_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.export_jobs
    OWNER to postgres;
-- Index: idx_export_jobs_created_at

-- DROP INDEX IF EXISTS public.idx_export_jobs_created_at;

CREATE INDEX IF NOT EXISTS idx_export_jobs_created_at
    ON public.export_jobs USING btree
    (created_at DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_export_jobs_status_created

-- DROP INDEX IF EXISTS public.idx_export_jobs_status_created;

CREATE INDEX IF NOT EXISTS idx_export_jobs_status_created
    ON public.export_jobs USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST, created_at DESC NULLS FIRST)
    TABLESPACE pg_default;