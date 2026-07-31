-- Table: public.report_reviews
-- Audit record for every human review action on a report run.
-- status: pending | approved | rejected | overridden

CREATE TABLE IF NOT EXISTS public.report_reviews
(
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    run_id          uuid        NOT NULL,
    organization_id uuid        NOT NULL,
    reviewer_id     uuid        NOT NULL,
    status          varchar(20) NOT NULL DEFAULT 'pending',
    reviewed_at     timestamptz,
    comments        text,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT report_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT report_reviews_run_fkey FOREIGN KEY (run_id)
        REFERENCES public.report_runs (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT report_reviews_org_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT report_reviews_reviewer_fkey FOREIGN KEY (reviewer_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE RESTRICT
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_reviews
    OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_report_reviews_run_id
    ON public.report_reviews USING btree (run_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_report_reviews_organization_id
    ON public.report_reviews USING btree (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_report_reviews_reviewer
    ON public.report_reviews USING btree (reviewer_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_report_reviews_status
    ON public.report_reviews USING btree (status ASC NULLS LAST)
    TABLESPACE pg_default;
