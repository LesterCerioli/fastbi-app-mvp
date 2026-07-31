-- Migration: adapt existing public.dashboards to the FastBI dashboard service schema
-- Run this script ONCE against the database.
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards throughout.

-- ── Step 1: Add missing columns ───────────────────────────────────────────────

ALTER TABLE public.dashboards
    ADD COLUMN IF NOT EXISTS organization_id  UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS template_id      UUID REFERENCES public.dashboard_templates(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS description      TEXT,
    ADD COLUMN IF NOT EXISTS is_default       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS updated_by       CHARACTER VARYING(255),
    ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMP WITH TIME ZONE;

-- ── Step 2: Rename layout_config → layout (column name expected by the service) ──
-- Skip this step if the rename was already applied.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'dashboards'
          AND column_name  = 'layout_config'
    ) THEN
        ALTER TABLE public.dashboards RENAME COLUMN layout_config TO layout;
    END IF;
END$$;

-- ── Step 3: Add missing indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_dashboards_organization_id
    ON public.dashboards (organization_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dashboards_template_id
    ON public.dashboards (template_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dashboards_deleted_at
    ON public.dashboards (deleted_at);

-- Ensures only one default dashboard per organization (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboards_org_default
    ON public.dashboards (organization_id)
    WHERE is_default = TRUE AND deleted_at IS NULL;

-- ── Step 4: Backfill note ─────────────────────────────────────────────────────
-- If the table already has rows, organization_id will be NULL for those rows.
-- Populate them before enforcing NOT NULL:
--
--   UPDATE public.dashboards
--   SET organization_id = '<your-org-uuid>'
--   WHERE organization_id IS NULL;
--
--   ALTER TABLE public.dashboards
--       ALTER COLUMN organization_id SET NOT NULL;
