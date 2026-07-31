CREATE TABLE IF NOT EXISTS public.dataset_metadata
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dataset_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    filename character varying(500) COLLATE pg_catalog."default" NOT NULL,
    format_type character varying(20) COLLATE pg_catalog."default" NOT NULL,
    rows_count integer,
    columns_count integer,
    column_names jsonb,
    data_profile jsonb,
    storage_path character varying(1000) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dataset_metadata_pkey PRIMARY KEY (id),
    CONSTRAINT dataset_metadata_dataset_id_key UNIQUE (dataset_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.dataset_metadata
    OWNER to postgres;
-- Index: idx_dataset_metadata_column_names_gin

-- DROP INDEX IF EXISTS public.idx_dataset_metadata_column_names_gin;

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_column_names_gin
    ON public.dataset_metadata USING gin
    (column_names)
    TABLESPACE pg_default;
-- Index: idx_dataset_metadata_created

-- DROP INDEX IF EXISTS public.idx_dataset_metadata_created;

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_created
    ON public.dataset_metadata USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dataset_metadata_format

-- DROP INDEX IF EXISTS public.idx_dataset_metadata_format;

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_format
    ON public.dataset_metadata USING btree
    (format_type COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dataset_metadata_id

-- DROP INDEX IF EXISTS public.idx_dataset_metadata_id;

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_id
    ON public.dataset_metadata USING btree
    (dataset_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dataset_metadata_profile_gin

-- DROP INDEX IF EXISTS public.idx_dataset_metadata_profile_gin;

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_profile_gin
    ON public.dataset_metadata USING gin
    (data_profile)
    TABLESPACE pg_default;

-- Trigger: update_dataset_metadata_updated_at

-- DROP TRIGGER IF EXISTS update_dataset_metadata_updated_at ON public.dataset_metadata;

CREATE OR REPLACE TRIGGER update_dataset_metadata_updated_at
    BEFORE UPDATE 
    ON public.dataset_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();