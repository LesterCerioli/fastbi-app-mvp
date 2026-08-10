-- Table: public.traffic_analytics

-- DROP TABLE IF EXISTS public.traffic_analytics;

CREATE TABLE IF NOT EXISTS public.traffic_analytics
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    metric_date date NOT NULL,
    channel character varying(50) COLLATE pg_catalog."default",
    page character varying(255) COLLATE pg_catalog."default",
    page_views bigint DEFAULT 0,
    unique_visitors bigint DEFAULT 0,
    bounce_rate numeric(5,2),
    avg_session_seconds integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT traffic_analytics_pkey PRIMARY KEY (id),
    CONSTRAINT traffic_analytics_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.traffic_analytics
    OWNER to postgres;

CREATE UNIQUE INDEX IF NOT EXISTS idx_traffic_analytics_org_date_channel_page
    ON public.traffic_analytics USING btree
    (organization_id ASC NULLS LAST, metric_date ASC NULLS LAST, channel ASC NULLS LAST, page ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_traffic_analytics_org_date
    ON public.traffic_analytics USING btree
    (organization_id ASC NULLS LAST, metric_date DESC NULLS FIRST)
    TABLESPACE pg_default;