-- Table: public.insight_effectiveness

-- DROP TABLE IF EXISTS public.insight_effectiveness;

CREATE TABLE IF NOT EXISTS public.insight_effectiveness
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    insight_type character varying(100) COLLATE pg_catalog."default",
    insight_title character varying(255) COLLATE pg_catalog."default",
    recommendation_text text COLLATE pg_catalog."default",
    times_given integer DEFAULT 0,
    positive_feedback integer DEFAULT 0,
    negative_feedback integer DEFAULT 0,
    avg_effectiveness_score double precision DEFAULT 0.5,
    last_used timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT insight_effectiveness_pkey PRIMARY KEY (id),
    CONSTRAINT insight_effectiveness_insight_type_insight_title_key UNIQUE (insight_type, insight_title)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.insight_effectiveness
    OWNER to postgres;