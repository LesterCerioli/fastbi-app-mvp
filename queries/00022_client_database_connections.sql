-- Table: public.client_database_connections

-- DROP TABLE IF EXISTS public.client_database_connections;

CREATE TABLE IF NOT EXISTS public.client_database_connections
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    connection_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    db_type character varying(20) COLLATE pg_catalog."default" DEFAULT 'postgresql'::character varying,
    host character varying(255) COLLATE pg_catalog."default" NOT NULL,
    port integer NOT NULL,
    database_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    username character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_encrypted text COLLATE pg_catalog."default" NOT NULL,
    ssl_mode character varying(20) COLLATE pg_catalog."default" DEFAULT 'require'::character varying,
    max_rows_limit integer DEFAULT 10000,
    query_timeout_seconds integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp with time zone,
    CONSTRAINT client_database_connections_pkey PRIMARY KEY (id),
    CONSTRAINT fk_client_connections_organization FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.client_database_connections
    OWNER to postgres;

COMMENT ON TABLE public.client_database_connections
    IS 'Configurações de conexão com bancos de dados externos por organização';

COMMENT ON COLUMN public.client_database_connections.organization_id
    IS 'ID da organização no FastBI';

COMMENT ON COLUMN public.client_database_connections.password_encrypted
    IS 'Senha criptografada';

COMMENT ON COLUMN public.client_database_connections.max_rows_limit
    IS 'Limite máximo de linhas por consulta';

COMMENT ON COLUMN public.client_database_connections.query_timeout_seconds
    IS 'Timeout em segundos para cada query';
-- Index: idx_client_connections_is_active

-- DROP INDEX IF EXISTS public.idx_client_connections_is_active;

CREATE INDEX IF NOT EXISTS idx_client_connections_is_active
    ON public.client_database_connections USING btree
    (is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_client_connections_org_status

-- DROP INDEX IF EXISTS public.idx_client_connections_org_status;

CREATE INDEX IF NOT EXISTS idx_client_connections_org_status
    ON public.client_database_connections USING btree
    (organization_id ASC NULLS LAST, is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_client_connections_organization_id

-- DROP INDEX IF EXISTS public.idx_client_connections_organization_id;

CREATE INDEX IF NOT EXISTS idx_client_connections_organization_id
    ON public.client_database_connections USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trigger_update_client_connections_updated_at

-- DROP TRIGGER IF EXISTS trigger_update_client_connections_updated_at ON public.client_database_connections;

CREATE OR REPLACE TRIGGER trigger_update_client_connections_updated_at
    BEFORE UPDATE 
    ON public.client_database_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_connections_updated_at();