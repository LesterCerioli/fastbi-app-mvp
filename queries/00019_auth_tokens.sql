-- Table: public.auth_tokens

-- DROP TABLE IF EXISTS public.auth_tokens;

CREATE TABLE IF NOT EXISTS public.auth_tokens
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id character varying(255) COLLATE pg_catalog."default",
    jwt_token character varying(2048) COLLATE pg_catalog."default",
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT auth_tokens_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.auth_tokens
    OWNER to postgres;