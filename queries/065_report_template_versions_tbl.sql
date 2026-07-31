-- Table: public.report_template_versions
-- Issue #63: Template Versioning, Cloning and Organization-Scoped Library Management

CREATE TABLE IF NOT EXISTS public.report_template_versions
(
    id                uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id   uuid        NOT NULL,
    template_id       uuid        NOT NULL,
    version           integer     NOT NULL,
    sections_snapshot jsonb       NOT NULL DEFAULT '{}'::jsonb,
    changed_by        varchar(255),
    change_summary    text,
    created_at        timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT report_template_versions_pkey PRIMARY KEY (id),
    CONSTRAINT report_template_versions_template_version_unique
        UNIQUE (template_id, version),

    CONSTRAINT report_template_versions_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,

    CONSTRAINT report_template_versions_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES public.report_templates (id)
        ON UPDATE NO ACTION ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_template_versions OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_rtv_organization_id
    ON public.report_template_versions USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtv_template_id
    ON public.report_template_versions USING btree (template_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtv_template_version
    ON public.report_template_versions USING btree
    (template_id ASC NULLS LAST, version ASC NULLS LAST);
