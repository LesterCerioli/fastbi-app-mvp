-- Table: public.report_template_widgets
-- Issue #62: Template Designer with Section & Widget Composition Engine

CREATE TABLE IF NOT EXISTS public.report_template_widgets
(
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid        NOT NULL,
    section_id      uuid        NOT NULL,
    widget_type     varchar(30) NOT NULL,
    data_binding    jsonb       NOT NULL DEFAULT '{}'::jsonb,
    style_config    jsonb       NOT NULL DEFAULT '{}'::jsonb,
    order_index     integer     NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT report_template_widgets_pkey PRIMARY KEY (id),
    CONSTRAINT report_template_widgets_section_order_unique
        UNIQUE (section_id, order_index),

    CONSTRAINT report_template_widgets_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,

    CONSTRAINT report_template_widgets_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.report_template_sections (id)
        ON UPDATE NO ACTION ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_template_widgets OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_rtw_organization_id
    ON public.report_template_widgets USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtw_section_id
    ON public.report_template_widgets USING btree (section_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rtw_section_order
    ON public.report_template_widgets USING btree (section_id ASC NULLS LAST, order_index ASC NULLS LAST);
