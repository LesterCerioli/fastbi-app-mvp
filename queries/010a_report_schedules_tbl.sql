-- Report schedules: CRON-based configuration for automated report generation.
-- Soft-delete is achieved by setting is_active = false (no deleted_at column).
-- This script must be executed BEFORE 011_report_jobs_tbl.sql.
CREATE TABLE IF NOT EXISTS public.report_schedules (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id          UUID         REFERENCES public.dashboard_templates(id) ON DELETE SET NULL,
    name                 VARCHAR(255) NOT NULL,
    cron_expression      VARCHAR(100) NOT NULL,
    timezone             VARCHAR(100) NOT NULL DEFAULT 'UTC',
    export_format        VARCHAR(50)  NOT NULL DEFAULT 'pdf',
    language             VARCHAR(10)  NOT NULL DEFAULT 'en',
    distribution_list_id UUID,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    next_run_at          TIMESTAMP WITH TIME ZONE,
    last_run_at          TIMESTAMP WITH TIME ZONE,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id
    ON public.report_schedules (organization_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active
    ON public.report_schedules (is_active);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at
    ON public.report_schedules (next_run_at)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_report_schedules_template_id
    ON public.report_schedules (template_id)
    WHERE template_id IS NOT NULL;
