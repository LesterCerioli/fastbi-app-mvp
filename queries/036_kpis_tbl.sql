-- Table: public.kpis

-- DROP TABLE IF EXISTS public.kpis;

CREATE TABLE IF NOT EXISTS public.kpis
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    code character varying(50) COLLATE pg_catalog."default" NOT NULL,
    name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    category kpi_category NOT NULL,
    unit kpi_unit NOT NULL,
    aggregation aggregation_type NOT NULL,
    target_value numeric(20,4),
    target_min numeric(20,4),
    target_max numeric(20,4),
    comparison_operator comparison_operator DEFAULT 'greater_than'::comparison_operator,
    alert_threshold numeric(20,4),
    alert_enabled boolean DEFAULT false,
    alert_severity character varying(20) COLLATE pg_catalog."default",
    calculation_query text COLLATE pg_catalog."default",
    calculation_schema jsonb,
    depends_on uuid[] DEFAULT '{}'::uuid[],
    reporting_period character varying(20) COLLATE pg_catalog."default",
    lookback_days integer DEFAULT 30,
    applicable_regions text[] COLLATE pg_catalog."default" DEFAULT '{}'::text[],
    applicable_departments text[] COLLATE pg_catalog."default" DEFAULT '{}'::text[],
    applicable_business_units text[] COLLATE pg_catalog."default" DEFAULT '{}'::text[],
    required_roles text[] COLLATE pg_catalog."default" DEFAULT '{}'::text[],
    view_permissions jsonb DEFAULT '{}'::jsonb,
    status kpi_status DEFAULT 'draft'::kpi_status,
    version integer DEFAULT 1,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_calculated_at timestamp with time zone,
    last_value numeric(20,4),
    last_variance_percentage numeric(10,2),
    CONSTRAINT kpis_pkey PRIMARY KEY (id),
    CONSTRAINT kpis_organization_id_code_key UNIQUE (organization_id, code),
    CONSTRAINT kpis_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT kpis_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT kpis_updated_by_fkey FOREIGN KEY (updated_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT kpis_alert_severity_check CHECK (alert_severity::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying]::text[])),
    CONSTRAINT kpis_reporting_period_check CHECK (reporting_period::text = ANY (ARRAY['realtime'::character varying, 'hourly'::character varying, 'daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'annual'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.kpis
    OWNER to postgres;
-- Index: idx_kpis_applicable_regions

-- DROP INDEX IF EXISTS public.idx_kpis_applicable_regions;

CREATE INDEX IF NOT EXISTS idx_kpis_applicable_regions
    ON public.kpis USING gin
    (applicable_regions COLLATE pg_catalog."default")
    TABLESPACE pg_default;
-- Index: idx_kpis_calculation_schema

-- DROP INDEX IF EXISTS public.idx_kpis_calculation_schema;

CREATE INDEX IF NOT EXISTS idx_kpis_calculation_schema
    ON public.kpis USING gin
    (calculation_schema)
    TABLESPACE pg_default;
-- Index: idx_kpis_org_category

-- DROP INDEX IF EXISTS public.idx_kpis_org_category;

CREATE INDEX IF NOT EXISTS idx_kpis_org_category
    ON public.kpis USING btree
    (organization_id ASC NULLS LAST, category ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_kpis_org_status

-- DROP INDEX IF EXISTS public.idx_kpis_org_status;

CREATE INDEX IF NOT EXISTS idx_kpis_org_status
    ON public.kpis USING btree
    (organization_id ASC NULLS LAST, status ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_kpis_organization

-- DROP INDEX IF EXISTS public.idx_kpis_organization;

CREATE INDEX IF NOT EXISTS idx_kpis_organization
    ON public.kpis USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_kpis_updated_at

-- DROP INDEX IF EXISTS public.idx_kpis_updated_at;

CREATE INDEX IF NOT EXISTS idx_kpis_updated_at
    ON public.kpis USING btree
    (updated_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_kpis_updated_at_active

-- DROP INDEX IF EXISTS public.idx_kpis_updated_at_active;

CREATE INDEX IF NOT EXISTS idx_kpis_updated_at_active
    ON public.kpis USING btree
    (updated_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status = 'active'::kpi_status;
-- Index: idx_kpis_view_permissions

-- DROP INDEX IF EXISTS public.idx_kpis_view_permissions;

CREATE INDEX IF NOT EXISTS idx_kpis_view_permissions
    ON public.kpis USING gin
    (view_permissions)
    TABLESPACE pg_default;

-- Trigger: kpi_stream_trigger

-- DROP TRIGGER IF EXISTS kpi_stream_trigger ON public.kpis;

CREATE OR REPLACE TRIGGER kpi_stream_trigger
    AFTER INSERT OR DELETE OR UPDATE 
    ON public.kpis
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_kpi_change();