-- Table: public.roles

-- DROP TABLE IF EXISTS public.roles;

CREATE TABLE IF NOT EXISTS public.roles
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    user_role character varying(50) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_role UNIQUE (user_id),
    CONSTRAINT fk_roles_user_id FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.roles
    OWNER to postgres;

COMMENT ON TABLE public.roles
    IS 'Tabela de papéis/roles dos usuários';

COMMENT ON COLUMN public.roles.id
    IS 'Identificador único do role (UUID)';

COMMENT ON COLUMN public.roles.user_id
    IS 'Referência ao ID do usuário na tabela users';

COMMENT ON COLUMN public.roles.user_role
    IS 'Papel/função do usuário (admin, user, etc.)';

COMMENT ON COLUMN public.roles.created_at
    IS 'Data de criação do registro';

COMMENT ON COLUMN public.roles.updated_at
    IS 'Data da última atualização do registro';
-- Index: idx_roles_user_id

-- DROP INDEX IF EXISTS public.idx_roles_user_id;

CREATE INDEX IF NOT EXISTS idx_roles_user_id
    ON public.roles USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_roles_user_role

-- DROP INDEX IF EXISTS public.idx_roles_user_role;

CREATE INDEX IF NOT EXISTS idx_roles_user_role
    ON public.roles USING btree
    (user_role COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trigger_auto_migrate_new_role

-- DROP TRIGGER IF EXISTS trigger_auto_migrate_new_role ON public.roles;

CREATE OR REPLACE TRIGGER trigger_auto_migrate_new_role
    AFTER INSERT
    ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_migrate_new_role();

-- Trigger: trigger_sync_roles_from_users

-- DROP TRIGGER IF EXISTS trigger_sync_roles_from_users ON public.roles;

CREATE OR REPLACE TRIGGER trigger_sync_roles_from_users
    AFTER INSERT
    ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_roles_from_users();

-- Trigger: update_roles_updated_at

-- DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;

CREATE OR REPLACE TRIGGER update_roles_updated_at
    BEFORE UPDATE 
    ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();