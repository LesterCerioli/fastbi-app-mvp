-- Table: public.import_jobs

-- DROP TABLE IF EXISTS public.import_jobs;

CREATE TABLE IF NOT EXISTS public.import_jobs
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    filename character varying(255) COLLATE pg_catalog."default" NOT NULL,
    file_data bytea NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'pending'::character varying,
    error_message text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    CONSTRAINT import_jobs_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.import_jobs
    OWNER to postgres;
-- Index: idx_import_jobs_created_at

-- DROP INDEX IF EXISTS public.idx_import_jobs_created_at;

CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at
    ON public.import_jobs USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_import_jobs_failed

-- DROP INDEX IF EXISTS public.idx_import_jobs_failed;

CREATE INDEX IF NOT EXISTS idx_import_jobs_failed
    ON public.import_jobs USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status::text = 'failed'::text;
-- Index: idx_import_jobs_filename

-- DROP INDEX IF EXISTS public.idx_import_jobs_filename;

CREATE INDEX IF NOT EXISTS idx_import_jobs_filename
    ON public.import_jobs USING btree
    (filename COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_import_jobs_pending_created

-- DROP INDEX IF EXISTS public.idx_import_jobs_pending_created;

CREATE INDEX IF NOT EXISTS idx_import_jobs_pending_created
    ON public.import_jobs USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST, created_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status::text = 'pending'::text;
-- Index: idx_import_jobs_status

-- DROP INDEX IF EXISTS public.idx_import_jobs_status;

CREATE INDEX IF NOT EXISTS idx_import_jobs_status
    ON public.import_jobs USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;