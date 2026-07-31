-- Table: public.learning_patterns

-- DROP TABLE IF EXISTS public.learning_patterns;

CREATE TABLE IF NOT EXISTS public.learning_patterns
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pattern_type character varying(50) COLLATE pg_catalog."default",
    pattern_data jsonb,
    confidence_score double precision,
    times_validated integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT learning_patterns_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.learning_patterns
    OWNER to postgres;