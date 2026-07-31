-- Table: public.agent_patterns

-- DROP TABLE IF EXISTS public.agent_patterns;

CREATE TABLE IF NOT EXISTS public.agent_patterns
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    trigger_signature text COLLATE pg_catalog."default" NOT NULL,
    action_taken text COLLATE pg_catalog."default" NOT NULL,
    outcome_success double precision DEFAULT 0,
    effectiveness_score double precision DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    last_used_at timestamp without time zone DEFAULT now(),
    CONSTRAINT agent_patterns_pkey PRIMARY KEY (id),
    CONSTRAINT agent_patterns_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.agent_patterns
    OWNER to postgres;
-- Index: idx_agent_patterns_effectiveness

-- DROP INDEX IF EXISTS public.idx_agent_patterns_effectiveness;

CREATE INDEX IF NOT EXISTS idx_agent_patterns_effectiveness
    ON public.agent_patterns USING btree
    (effectiveness_score DESC NULLS FIRST)
    TABLESPACE pg_default
    WHERE effectiveness_score > 0::double precision;
-- Index: idx_agent_patterns_org_trigger

-- DROP INDEX IF EXISTS public.idx_agent_patterns_org_trigger;

CREATE INDEX IF NOT EXISTS idx_agent_patterns_org_trigger
    ON public.agent_patterns USING btree
    (organization_id ASC NULLS LAST, trigger_signature COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;