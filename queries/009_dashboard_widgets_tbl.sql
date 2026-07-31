-- Dashboard widgets: individual panels placed on a dashboard
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id     UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    widget_type      VARCHAR(100) NOT NULL,
    title            VARCHAR(200),
    description      TEXT,
    kpi_id           UUID REFERENCES public.kpis(id) ON DELETE SET NULL,
    config           JSONB   NOT NULL DEFAULT '{}',
    position         JSONB   NOT NULL DEFAULT '{"x":0,"y":0}',
    size             JSONB   NOT NULL DEFAULT '{"w":4,"h":3}',
    refresh_interval INTEGER NOT NULL DEFAULT 300,
    is_visible       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id
    ON public.dashboard_widgets (dashboard_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_organization_id
    ON public.dashboard_widgets (organization_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_kpi_id
    ON public.dashboard_widgets (kpi_id)
    WHERE kpi_id IS NOT NULL;
