-- Table: public.analysis_history

-- DROP TABLE IF EXISTS public.analysis_history;

CREATE TABLE IF NOT EXISTS public.analysis_history
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    organization_name character varying(255) COLLATE pg_catalog."default",
    analysis_date timestamp without time zone DEFAULT now(),
    health_score integer,
    total_revenue numeric(15,2),
    total_transactions integer,
    avg_margin numeric(5,2),
    insights_generated jsonb,
    recommendations jsonb,
    risks_identified jsonb,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT analysis_history_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.analysis_history
    OWNER to postgres;