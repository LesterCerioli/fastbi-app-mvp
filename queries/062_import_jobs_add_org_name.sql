-- Migration: add organization_id and name to public.import_jobs
-- Allows lookup by import_job_name (no raw IDs in API) and scoping by organization.

ALTER TABLE public.import_jobs
    ADD COLUMN IF NOT EXISTS organization_id uuid,
    ADD COLUMN IF NOT EXISTS name character varying(255);

ALTER TABLE public.import_jobs
    DROP CONSTRAINT IF EXISTS import_jobs_organization_id_fkey;

ALTER TABLE public.import_jobs
    ADD CONSTRAINT import_jobs_organization_id_fkey
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id)
        ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_import_jobs_org_name
    ON public.import_jobs (organization_id, name)
    WHERE organization_id IS NOT NULL AND name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_jobs_org_id
    ON public.import_jobs (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_import_jobs_name
    ON public.import_jobs (name ASC NULLS LAST);
