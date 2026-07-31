CREATE TABLE IF NOT EXISTS public.report_template_catalog
(
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id     uuid        NOT NULL,
    template_id         uuid        NOT NULL,
    scope               varchar(20) NOT NULL DEFAULT 'organization',
    industry_tag        varchar(100),
    preview_url         text,
    usage_count         integer     NOT NULL DEFAULT 0,
    current_version     integer     NOT NULL DEFAULT 1,
    source_template_id  uuid,
    source_version      integer,
    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT report_template_catalog_pkey PRIMARY KEY (id),
    CONSTRAINT report_template_catalog_template_id_unique
        UNIQUE (template_id),
    CONSTRAINT report_template_catalog_scope_check
        CHECK (scope IN ('platform', 'organization')),

    CONSTRAINT report_template_catalog_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,

    CONSTRAINT report_template_catalog_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES public.report_templates (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,

    CONSTRAINT report_template_catalog_source_template_fkey
        FOREIGN KEY (source_template_id) REFERENCES public.report_templates (id)
        ON UPDATE NO ACTION ON DELETE SET NULL
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_template_catalog OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_rtcat_organization_id
    ON public.report_template_catalog USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtcat_template_id
    ON public.report_template_catalog USING btree (template_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtcat_scope
    ON public.report_template_catalog USING btree (scope ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtcat_org_scope
    ON public.report_template_catalog USING btree
    (organization_id ASC NULLS LAST, scope ASC NULLS LAST);
