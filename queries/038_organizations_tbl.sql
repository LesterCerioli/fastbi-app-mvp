-- Table: public.organizations

-- DROP TABLE IF EXISTS public.organizations;

CREATE TABLE IF NOT EXISTS public.organizations
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    name character varying(100) COLLATE pg_catalog."default",
    address character varying(100) COLLATE pg_catalog."default",
    cnpj character varying(18) COLLATE pg_catalog."default",
    ein character varying(18) COLLATE pg_catalog."default",
    CONSTRAINT organizations_pkey PRIMARY KEY (id),
    CONSTRAINT uni_organizations_cnpj UNIQUE (cnpj),
    CONSTRAINT uni_organizations_ein UNIQUE (ein)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.organizations
    OWNER to postgres;
-- Index: idx_organizations_deleted_at

-- DROP INDEX IF EXISTS public.idx_organizations_deleted_at;

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at
    ON public.organizations USING btree
    (deleted_at ASC NULLS LAST)
    TABLESPACE pg_default;