CREATE TABLE IF NOT EXISTS public.agent_anomalies
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    metric_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    dimension_name character varying(50) COLLATE pg_catalog."default",
    dimension_value character varying(100) COLLATE pg_catalog."default",
    expected_value double precision NOT NULL,
    actual_value double precision NOT NULL,
    deviation_zscore double precision NOT NULL,
    detected_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    resolution_action text COLLATE pg_catalog."default",
    CONSTRAINT agent_anomalies_pkey PRIMARY KEY (id),
    CONSTRAINT agent_anomalies_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.agent_anomalies
    OWNER to postgres;
-- Index: idx_agent_anomalies_org_metric

-- DROP INDEX IF EXISTS public.idx_agent_anomalies_org_metric;

CREATE INDEX IF NOT EXISTS idx_agent_anomalies_org_metric
    ON public.agent_anomalies USING btree
    (organization_id ASC NULLS LAST, metric_name COLLATE pg_catalog."default" ASC NULLS LAST, detected_at DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_agent_anomalies_zscore

-- DROP INDEX IF EXISTS public.idx_agent_anomalies_zscore;

CREATE INDEX IF NOT EXISTS idx_agent_anomalies_zscore
    ON public.agent_anomalies USING btree
    (deviation_zscore DESC NULLS FIRST)
    TABLESPACE pg_default
    WHERE resolved_at IS NULL;