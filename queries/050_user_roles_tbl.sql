-- Table: public.user_roles

-- DROP TABLE IF EXISTS public.user_roles;

CREATE TABLE IF NOT EXISTS public.user_roles
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    revoked_at timestamp with time zone,
    revoked_by uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    migrated_at timestamp with time zone,
    source_system character varying(50) COLLATE pg_catalog."default" DEFAULT 'manual'::character varying,
    version integer DEFAULT 1,
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_role_combination UNIQUE (user_id, role_id),
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT fk_user_roles_revoked_by FOREIGN KEY (revoked_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id)
        REFERENCES public.roles (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_roles
    OWNER to postgres;

GRANT ALL ON TABLE public.user_roles TO postgres;

COMMENT ON TABLE public.user_roles
    IS 'Tabela de junção para relacionamento many-to-many entre usuários e roles';

COMMENT ON COLUMN public.user_roles.id
    IS 'Identificador único do registro';

COMMENT ON COLUMN public.user_roles.user_id
    IS 'Referência ao ID do usuário';

COMMENT ON COLUMN public.user_roles.role_id
    IS 'Referência ao ID do role';

COMMENT ON COLUMN public.user_roles.assigned_by
    IS 'ID do usuário que atribuiu este role';

COMMENT ON COLUMN public.user_roles.assigned_at
    IS 'Data/Hora da atribuição do role';

COMMENT ON COLUMN public.user_roles.revoked_at
    IS 'Data/Hora da revogação do role';

COMMENT ON COLUMN public.user_roles.revoked_by
    IS 'ID do usuário que revogou este role';

COMMENT ON COLUMN public.user_roles.is_active
    IS 'Indica se o role está ativo para o usuário';

COMMENT ON COLUMN public.user_roles.created_at
    IS 'Data de criação do registro';

COMMENT ON COLUMN public.user_roles.updated_at
    IS 'Data da última atualização do registro';
-- Index: idx_user_roles_assigned_at

-- DROP INDEX IF EXISTS public.idx_user_roles_assigned_at;

CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at
    ON public.user_roles USING btree
    (assigned_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_roles_assigned_by

-- DROP INDEX IF EXISTS public.idx_user_roles_assigned_by;

CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by
    ON public.user_roles USING btree
    (assigned_by ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_roles_is_active

-- DROP INDEX IF EXISTS public.idx_user_roles_is_active;

CREATE INDEX IF NOT EXISTS idx_user_roles_is_active
    ON public.user_roles USING btree
    (is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_roles_revoked_by

-- DROP INDEX IF EXISTS public.idx_user_roles_revoked_by;

CREATE INDEX IF NOT EXISTS idx_user_roles_revoked_by
    ON public.user_roles USING btree
    (revoked_by ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_roles_role_id

-- DROP INDEX IF EXISTS public.idx_user_roles_role_id;

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id
    ON public.user_roles USING btree
    (role_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_roles_user_active

-- DROP INDEX IF EXISTS public.idx_user_roles_user_active;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_active
    ON public.user_roles USING btree
    (user_id ASC NULLS LAST, is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_roles_user_id

-- DROP INDEX IF EXISTS public.idx_user_roles_user_id;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
    ON public.user_roles USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trigger_user_roles_updated_at

-- DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON public.user_roles;

CREATE OR REPLACE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE 
    ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();