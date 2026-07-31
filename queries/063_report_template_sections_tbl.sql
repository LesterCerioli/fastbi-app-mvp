-- Table: public.report_template_sections
-- Issue #62: Template Designer with Section & Widget Composition Engine

CREATE TABLE IF NOT EXISTS public.report_template_sections
(
    id               uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL,
    template_id      uuid        NOT NULL,
    type             varchar(30) NOT NULL,
    order_index      integer     NOT NULL,
    config           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    is_optional      boolean     NOT NULL DEFAULT false,
    visibility_rule  jsonb,
    created_at       timestamptz NOT NULL DEFAULT NOW(),
    updated_at       timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT report_template_sections_pkey PRIMARY KEY (id),
    CONSTRAINT report_template_sections_template_order_unique
        UNIQUE (template_id, order_index),
    CONSTRAINT report_template_sections_type_check
        CHECK (type IN ('narrative','kpi_summary','chart','table','executive_summary','custom_html')),

    CONSTRAINT report_template_sections_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,

    CONSTRAINT report_template_sections_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES public.report_templates (id)
        ON UPDATE NO ACTION ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_template_sections OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_rts_organization_id
    ON public.report_template_sections USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rts_template_id
    ON public.report_template_sections USING btree (template_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rts_template_order
    ON public.report_template_sections USING btree (template_id ASC NULLS LAST, order_index ASC NULLS LAST);
