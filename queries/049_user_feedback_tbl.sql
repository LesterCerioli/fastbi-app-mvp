-- Table: public.user_feedback

-- DROP TABLE IF EXISTS public.user_feedback;

CREATE TABLE IF NOT EXISTS public.user_feedback
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    analysis_id uuid,
    insight_id character varying(100) COLLATE pg_catalog."default",
    feedback_type character varying(20) COLLATE pg_catalog."default",
    feedback_text text COLLATE pg_catalog."default",
    user_action_taken boolean DEFAULT false,
    actual_impact_observed numeric(15,2),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
    CONSTRAINT user_feedback_feedback_type_check CHECK (feedback_type::text = ANY (ARRAY['positive'::character varying, 'negative'::character varying, 'neutral'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_feedback
    OWNER to postgres;