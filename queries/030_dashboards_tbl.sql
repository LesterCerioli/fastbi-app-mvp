CREATE TABLE IF NOT EXISTS public.dashboards
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dashboard_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    dataset_ids jsonb NOT NULL,
    layout_config jsonb NOT NULL,
    business_context character varying(50) COLLATE pg_catalog."default",
    refresh_rate character varying(20) COLLATE pg_catalog."default",
    is_public boolean DEFAULT false,
    created_by character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dashboards_pkey PRIMARY KEY (id),
    CONSTRAINT dashboards_dashboard_id_key UNIQUE (dashboard_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.dashboards
    OWNER to postgres;
-- Index: idx_dashboards_context

-- DROP INDEX IF EXISTS public.idx_dashboards_context;

CREATE INDEX IF NOT EXISTS idx_dashboards_context
    ON public.dashboards USING btree
    (business_context COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dashboards_created

-- DROP INDEX IF EXISTS public.idx_dashboards_created;

CREATE INDEX IF NOT EXISTS idx_dashboards_created
    ON public.dashboards USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dashboards_id

-- DROP INDEX IF EXISTS public.idx_dashboards_id;

CREATE INDEX IF NOT EXISTS idx_dashboards_id
    ON public.dashboards USING btree
    (dashboard_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dashboards_layout_gin

-- DROP INDEX IF EXISTS public.idx_dashboards_layout_gin;

CREATE INDEX IF NOT EXISTS idx_dashboards_layout_gin
    ON public.dashboards USING gin
    (layout_config)
    TABLESPACE pg_default;

-- Trigger: update_dashboards_updated_at

-- DROP TRIGGER IF EXISTS update_dashboards_updated_at ON public.dashboards;

CREATE OR REPLACE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE 
    ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();