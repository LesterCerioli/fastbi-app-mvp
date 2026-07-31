-- Table: public.visualizations

-- DROP TABLE IF EXISTS public.visualizations;

CREATE TABLE IF NOT EXISTS public.visualizations
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    visualization_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    dataset_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    chart_type character varying(50) COLLATE pg_catalog."default" NOT NULL,
    config_json jsonb,
    html_content text COLLATE pg_catalog."default",
    chart_spec_json jsonb,
    image_base64 text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT visualizations_pkey PRIMARY KEY (id),
    CONSTRAINT visualizations_visualization_id_key UNIQUE (visualization_id),
    CONSTRAINT visualizations_dataset_id_fkey FOREIGN KEY (dataset_id)
        REFERENCES public.dataset_metadata (dataset_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.visualizations
    OWNER to postgres;
-- Index: idx_visualizations_config_gin

-- DROP INDEX IF EXISTS public.idx_visualizations_config_gin;

CREATE INDEX IF NOT EXISTS idx_visualizations_config_gin
    ON public.visualizations USING gin
    (config_json)
    TABLESPACE pg_default;
-- Index: idx_visualizations_created

-- DROP INDEX IF EXISTS public.idx_visualizations_created;

CREATE INDEX IF NOT EXISTS idx_visualizations_created
    ON public.visualizations USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_visualizations_dataset

-- DROP INDEX IF EXISTS public.idx_visualizations_dataset;

CREATE INDEX IF NOT EXISTS idx_visualizations_dataset
    ON public.visualizations USING btree
    (dataset_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_visualizations_type

-- DROP INDEX IF EXISTS public.idx_visualizations_type;

CREATE INDEX IF NOT EXISTS idx_visualizations_type
    ON public.visualizations USING btree
    (chart_type COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;