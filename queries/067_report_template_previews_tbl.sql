-- Table: public.report_template_previews
-- Issue #64: Template Preview, Test Rendering and Performance Benchmarking

CREATE TABLE IF NOT EXISTS public.report_template_previews
(
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL,
    template_id     uuid        NOT NULL,
    version         integer     NOT NULL DEFAULT 1,
    format          varchar(20) NOT NULL DEFAULT 'html',
    data_source     varchar(20) NOT NULL DEFAULT 'synthetic',
    artifact_url    text,
    render_time_ms  integer     NOT NULL DEFAULT 0,
    section_count   integer     NOT NULL DEFAULT 0,
    estimated_pages integer     NOT NULL DEFAULT 1,
    created_at      timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT report_template_previews_pkey PRIMARY KEY (id),
    CONSTRAINT report_template_previews_format_check
        CHECK (format IN ('pdf', 'excel', 'html')),
    CONSTRAINT report_template_previews_data_source_check
        CHECK (data_source IN ('synthetic', 'live')),

    CONSTRAINT report_template_previews_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT report_template_previews_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES public.report_templates (id)
        ON UPDATE NO ACTION ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_template_previews OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_rtprev_organization_id
    ON public.report_template_previews USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtprev_template_id
    ON public.report_template_previews USING btree (template_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtprev_template_version
    ON public.report_template_previews USING btree
    (template_id ASC NULLS LAST, version ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtprev_created_at
    ON public.report_template_previews USING btree (created_at DESC NULLS LAST);
