-- Dashboards: organization-scoped custom dashboards (private, not shared across orgs)
CREATE TABLE IF NOT EXISTS public.dashboards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id     UUID REFERENCES public.dashboard_templates(id) ON DELETE SET NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    layout          JSONB        NOT NULL DEFAULT '{}',
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_dashboards_organization_id
    ON public.dashboards (organization_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dashboards_template_id
    ON public.dashboards (template_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dashboards_deleted_at
    ON public.dashboards (deleted_at);

-- Only one default dashboard per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboards_org_default
    ON public.dashboards (organization_id)
    WHERE is_default = TRUE AND deleted_at IS NULL;
