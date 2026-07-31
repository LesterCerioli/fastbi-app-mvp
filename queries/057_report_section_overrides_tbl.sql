-- Table: public.report_section_overrides
-- Immutable audit log of every human override applied to an AI-generated section.
-- Original AI text is always preserved; override_text carries the human replacement.

CREATE TABLE IF NOT EXISTS public.report_section_overrides
(
    id              uuid         NOT NULL DEFAULT gen_random_uuid(),
    run_id          uuid         NOT NULL,
    organization_id uuid         NOT NULL,
    section_id      varchar(100) NOT NULL,
    original_text   text         NOT NULL,
    override_text   text         NOT NULL,
    override_by     uuid         NOT NULL,
    override_reason text,
    overridden_at   timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT report_section_overrides_pkey PRIMARY KEY (id),
    CONSTRAINT report_section_overrides_run_fkey FOREIGN KEY (run_id)
        REFERENCES public.report_runs (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT report_section_overrides_org_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT report_section_overrides_user_fkey FOREIGN KEY (override_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE RESTRICT
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_section_overrides
    OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_section_overrides_run_id
    ON public.report_section_overrides USING btree (run_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_section_overrides_section
    ON public.report_section_overrides USING btree (section_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_section_overrides_by
    ON public.report_section_overrides USING btree (override_by ASC NULLS LAST)
    TABLESPACE pg_default;
