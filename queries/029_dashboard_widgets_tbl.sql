CREATE TABLE IF NOT EXISTS public.dashboard_widgets
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dashboard_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    widget_type character varying(100) COLLATE pg_catalog."default" NOT NULL,
    title character varying(200) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    kpi_id uuid,
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    "position" jsonb NOT NULL DEFAULT '{"x": 0, "y": 0}'::jsonb,
    size jsonb NOT NULL DEFAULT '{"h": 3, "w": 4}'::jsonb,
    refresh_interval integer NOT NULL DEFAULT 300,
    is_visible boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dashboard_widgets_pkey PRIMARY KEY (id),
    CONSTRAINT dashboard_widgets_dashboard_id_fkey FOREIGN KEY (dashboard_id)
        REFERENCES public.dashboards (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT dashboard_widgets_kpi_id_fkey FOREIGN KEY (kpi_id)
        REFERENCES public.kpis (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT dashboard_widgets_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.dashboard_widgets
    OWNER to postgres;
-- Index: idx_dashboard_widgets_dashboard_id

-- DROP INDEX IF EXISTS public.idx_dashboard_widgets_dashboard_id;

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id
    ON public.dashboard_widgets USING btree
    (dashboard_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_dashboard_widgets_kpi_id

-- DROP INDEX IF EXISTS public.idx_dashboard_widgets_kpi_id;

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_kpi_id
    ON public.dashboard_widgets USING btree
    (kpi_id ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE kpi_id IS NOT NULL;
-- Index: idx_dashboard_widgets_organization_id

-- DROP INDEX IF EXISTS public.idx_dashboard_widgets_organization_id;

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_organization_id
    ON public.dashboard_widgets USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;