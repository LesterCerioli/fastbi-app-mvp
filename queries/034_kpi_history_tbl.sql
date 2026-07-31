-- Table: public.kpi_history

-- DROP TABLE IF EXISTS public.kpi_history;

CREATE TABLE IF NOT EXISTS public.kpi_history
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    kpi_id uuid NOT NULL,
    version integer NOT NULL,
    name character varying(200) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    target_value numeric(20,4),
    target_min numeric(20,4),
    target_max numeric(20,4),
    alert_threshold numeric(20,4),
    calculation_query text COLLATE pg_catalog."default",
    calculation_schema jsonb,
    depends_on uuid[],
    reporting_period character varying(20) COLLATE pg_catalog."default",
    lookback_days integer,
    applicable_regions text[] COLLATE pg_catalog."default",
    applicable_departments text[] COLLATE pg_catalog."default",
    applicable_business_units text[] COLLATE pg_catalog."default",
    required_roles text[] COLLATE pg_catalog."default",
    view_permissions jsonb,
    status kpi_status,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    change_reason text COLLATE pg_catalog."default",
    CONSTRAINT kpi_history_pkey PRIMARY KEY (id),
    CONSTRAINT kpi_history_changed_by_fkey FOREIGN KEY (changed_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT kpi_history_kpi_id_fkey FOREIGN KEY (kpi_id)
        REFERENCES public.kpis (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT kpi_history_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.kpi_history
    OWNER to postgres;
-- Index: idx_kpi_history_changed_at

-- DROP INDEX IF EXISTS public.idx_kpi_history_changed_at;

CREATE INDEX IF NOT EXISTS idx_kpi_history_changed_at
    ON public.kpi_history USING btree
    (changed_at DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_kpi_history_kpi_id

-- DROP INDEX IF EXISTS public.idx_kpi_history_kpi_id;

CREATE INDEX IF NOT EXISTS idx_kpi_history_kpi_id
    ON public.kpi_history USING btree
    (kpi_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_kpi_history_org_kpi_version

-- DROP INDEX IF EXISTS public.idx_kpi_history_org_kpi_version;

CREATE INDEX IF NOT EXISTS idx_kpi_history_org_kpi_version
    ON public.kpi_history USING btree
    (organization_id ASC NULLS LAST, kpi_id ASC NULLS LAST, version DESC NULLS FIRST)
    TABLESPACE pg_default;