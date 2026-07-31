-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid,
    name text COLLATE pg_catalog."default",
    email text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    role text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
-- Index: idx_users_deleted_at

-- DROP INDEX IF EXISTS public.idx_users_deleted_at;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
    ON public.users USING btree
    (deleted_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_users_email_unique

-- DROP INDEX IF EXISTS public.idx_users_email_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
    ON public.users USING btree
    (email COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE deleted_at IS NULL;
-- Index: idx_users_organization_id

-- DROP INDEX IF EXISTS public.idx_users_organization_id;

CREATE INDEX IF NOT EXISTS idx_users_organization_id
    ON public.users USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE deleted_at IS NULL;

-- Trigger: trigger_auto_assign_default_role

-- DROP TRIGGER IF EXISTS trigger_auto_assign_default_role ON public.users;

CREATE OR REPLACE TRIGGER trigger_auto_assign_default_role
    AFTER INSERT
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_default_role();

-- Trigger: trigger_update_users_updated_at

-- DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;

CREATE OR REPLACE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE 
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();