CREATE TABLE IF NOT EXISTS public.report_csv_profiles
(
    id               uuid        NOT NULL DEFAULT gen_random_uuid(),
    organization_id  uuid        NOT NULL,
    template_id      uuid        NOT NULL,
    profile_config   jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at       timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_csv_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT report_csv_profiles_org_template_unique UNIQUE (organization_id, template_id),

    CONSTRAINT report_csv_profiles_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,

    CONSTRAINT report_csv_profiles_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.report_templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_csv_profiles
    OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_report_csv_profiles_org_id
    ON public.report_csv_profiles USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_report_csv_profiles_template_id
    ON public.report_csv_profiles USING btree (template_id ASC NULLS LAST);
