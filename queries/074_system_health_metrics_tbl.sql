-- Table: public.system_health_metrics

-- DROP TABLE IF EXISTS public.system_health_metrics;

CREATE TABLE IF NOT EXISTS public.system_health_metrics
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    collected_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    service_name character varying(50) COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default",
    uptime_percent numeric(5,2),
    cpu_usage_percent numeric(5,2),
    memory_usage_percent numeric(5,2),
    disk_usage_percent numeric(5,2),
    network_usage_percent numeric(5,2),
    response_time_ms integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT system_health_metrics_pkey PRIMARY KEY (id),
    CONSTRAINT system_health_metrics_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.system_health_metrics
    OWNER to postgres;

CREATE INDEX IF NOT EXISTS idx_system_health_org_collected
    ON public.system_health_metrics USING btree
    (organization_id ASC NULLS LAST, collected_at DESC NULLS FIRST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_system_health_org_service
    ON public.system_health_metrics USING btree
    (organization_id ASC NULLS LAST, service_name ASC NULLS LAST)
    TABLESPACE pg_default;