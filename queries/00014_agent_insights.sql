-- Table: public.agent_insights

-- DROP TABLE IF EXISTS public.agent_insights;

CREATE TABLE IF NOT EXISTS public.agent_insights
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    insight_type character varying(50) COLLATE pg_catalog."default" NOT NULL,
    severity character varying(20) COLLATE pg_catalog."default" NOT NULL,
    title text COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default" NOT NULL,
    confidence double precision DEFAULT 0.5,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    is_dismissed boolean DEFAULT false,
    dismissed_at timestamp without time zone,
    CONSTRAINT agent_insights_pkey PRIMARY KEY (id),
    CONSTRAINT agent_insights_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.agent_insights
    OWNER to postgres;
-- Index: idx_agent_insights_org_created

-- DROP INDEX IF EXISTS public.idx_agent_insights_org_created;

CREATE INDEX IF NOT EXISTS idx_agent_insights_org_created
    ON public.agent_insights USING btree
    (organization_id ASC NULLS LAST, created_at DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_agent_insights_severity

-- DROP INDEX IF EXISTS public.idx_agent_insights_severity;

CREATE INDEX IF NOT EXISTS idx_agent_insights_severity
    ON public.agent_insights USING btree
    (severity COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE is_dismissed = false;