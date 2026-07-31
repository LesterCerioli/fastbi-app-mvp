-- Table: public.owners

-- DROP TABLE IF EXISTS public.owners;

CREATE TABLE IF NOT EXISTS public.owners
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    owner_name character varying(100) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT owners_pkey PRIMARY KEY (id),
    CONSTRAINT fk_owners_organization FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_owners_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.owners
    OWNER to postgres;
-- Index: idx_owners_organization_id

-- DROP INDEX IF EXISTS public.idx_owners_organization_id;

CREATE INDEX IF NOT EXISTS idx_owners_organization_id
    ON public.owners USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_owners_user_id

-- DROP INDEX IF EXISTS public.idx_owners_user_id;

CREATE INDEX IF NOT EXISTS idx_owners_user_id
    ON public.owners USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: update_owners_updated_at

-- DROP TRIGGER IF EXISTS update_owners_updated_at ON public.owners;

CREATE OR REPLACE TRIGGER update_owners_updated_at
    BEFORE UPDATE 
    ON public.owners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();