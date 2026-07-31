-- Table: public.analysis_results

-- DROP TABLE IF EXISTS public.analysis_results;

CREATE TABLE IF NOT EXISTS public.analysis_results
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    analysis_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    dataset_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    business_context character varying(50) COLLATE pg_catalog."default",
    analysis_type character varying(50) COLLATE pg_catalog."default",
    metrics_analyzed jsonb,
    dimensions_used jsonb,
    analysis_json jsonb,
    insights jsonb,
    recommendations jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT analysis_results_pkey PRIMARY KEY (id),
    CONSTRAINT analysis_results_analysis_id_key UNIQUE (analysis_id),
    CONSTRAINT analysis_results_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES public.dataset_metadata (dataset_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.analysis_results
    OWNER to postgres;
-- Index: idx_analysis_context

-- DROP INDEX IF EXISTS public.idx_analysis_context;

CREATE INDEX IF NOT EXISTS idx_analysis_context
    ON public.analysis_results USING btree
    (business_context COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_analysis_created

-- DROP INDEX IF EXISTS public.idx_analysis_created;

CREATE INDEX IF NOT EXISTS idx_analysis_created
    ON public.analysis_results USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_analysis_dataset

-- DROP INDEX IF EXISTS public.idx_analysis_dataset;

CREATE INDEX IF NOT EXISTS idx_analysis_dataset
    ON public.analysis_results USING btree
    (dataset_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_analysis_results_json_gin

-- DROP INDEX IF EXISTS public.idx_analysis_results_json_gin;

CREATE INDEX IF NOT EXISTS idx_analysis_results_json_gin
    ON public.analysis_results USING gin
    (analysis_json)
    TABLESPACE pg_default;
-- Index: idx_analysis_type

-- DROP INDEX IF EXISTS public.idx_analysis_type;

CREATE INDEX IF NOT EXISTS idx_analysis_type
    ON public.analysis_results USING btree
    (analysis_type COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;