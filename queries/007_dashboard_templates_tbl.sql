-- Dashboard templates: global models available to all organizations
CREATE TABLE IF NOT EXISTS public.dashboard_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(200)  NOT NULL,
    description   TEXT,
    category      VARCHAR(100),
    layout        JSONB         NOT NULL DEFAULT '{}',
    widgets       JSONB         NOT NULL DEFAULT '[]',
    tags          TEXT[]        NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_templates_category
    ON public.dashboard_templates (category)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_dashboard_templates_is_active
    ON public.dashboard_templates (is_active);
