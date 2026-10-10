-- Database Migrations table for tracking schema/data migrations between databases

CREATE TABLE IF NOT EXISTS public.database_migrations
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    source_connection_id uuid NOT NULL REFERENCES public.client_database_connections(id) ON DELETE CASCADE,
    target_connection_id uuid NOT NULL REFERENCES public.client_database_connections(id) ON DELETE CASCADE,
    source_db_type varchar(20) NOT NULL,
    target_db_type varchar(20) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    tables_total integer DEFAULT 0,
    tables_completed integer DEFAULT 0,
    rows_migrated bigint DEFAULT 0,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT database_migrations_pkey PRIMARY KEY (id),
    CONSTRAINT chk_different_connections CHECK (source_connection_id != target_connection_id),
    CONSTRAINT chk_valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.database_migrations
    OWNER to postgres;

COMMENT ON TABLE public.database_migrations
    IS 'Histórico de migrações de banco de dados entre conexões';

COMMENT ON COLUMN public.database_migrations.organization_id
    IS 'ID da organização no FastBI';

COMMENT ON COLUMN public.database_migrations.source_connection_id
    IS 'Conexão de origem da migração';

COMMENT ON COLUMN public.database_migrations.target_connection_id
    IS 'Conexão de destino da migração';

COMMENT ON COLUMN public.database_migrations.source_db_type
    IS 'Tipo do banco de dados de origem (postgresql, mysql, mssql, oracle, sqlite)';

COMMENT ON COLUMN public.database_migrations.target_db_type
    IS 'Tipo do banco de dados de destino (postgresql, mysql, mssql, oracle, sqlite)';

COMMENT ON COLUMN public.database_migrations.status
    IS 'Status da migração: pending, running, completed, failed, cancelled';

COMMENT ON COLUMN public.database_migrations.tables_total
    IS 'Total de tabelas a serem migradas';

COMMENT ON COLUMN public.database_migrations.tables_completed
    IS 'Tabelas já migradas com sucesso';

COMMENT ON COLUMN public.database_migrations.rows_migrated
    IS 'Total de linhas migradas';

COMMENT ON COLUMN public.database_migrations.error_message
    IS 'Mensagem de erro caso a migração falhe';

COMMENT ON COLUMN public.database_migrations.started_at
    IS 'Data/hora de início da execução';

COMMENT ON COLUMN public.database_migrations.completed_at
    IS 'Data/hora de conclusão (sucesso ou falha)';

-- Index: idx_migrations_org
CREATE INDEX IF NOT EXISTS idx_migrations_org
    ON public.database_migrations USING btree
    (organization_id ASC NULLS LAST, created_at DESC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_migrations_source
CREATE INDEX IF NOT EXISTS idx_migrations_source
    ON public.database_migrations USING btree
    (source_connection_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_migrations_target
CREATE INDEX IF NOT EXISTS idx_migrations_target
    ON public.database_migrations USING btree
    (target_connection_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_migrations_status
CREATE INDEX IF NOT EXISTS idx_migrations_status
    ON public.database_migrations USING btree
    (status ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trigger_update_migrations_updated_at
CREATE OR REPLACE TRIGGER trigger_update_migrations_updated_at
    BEFORE UPDATE
    ON public.database_migrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_connections_updated_at();