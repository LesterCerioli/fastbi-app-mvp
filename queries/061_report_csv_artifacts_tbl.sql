CREATE TABLE IF NOT EXISTS public.report_csv_artifacts
(
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    run_id          uuid        NOT NULL,
    organization_id uuid        NOT NULL,
    file_bytes      bytea       NOT NULL,
    file_size_bytes bigint      NOT NULL,
    file_name       character varying(255) NOT NULL,
    row_count       integer     NOT NULL DEFAULT 0,
    rendered_at     timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_csv_artifacts_pkey PRIMARY KEY (id),
    CONSTRAINT report_csv_artifacts_run_id_unique UNIQUE (run_id),

    CONSTRAINT report_csv_artifacts_run_id_fkey FOREIGN KEY (run_id)
        REFERENCES public.report_runs (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,

    CONSTRAINT report_csv_artifacts_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_csv_artifacts
    OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_report_csv_artifacts_run_id
    ON public.report_csv_artifacts USING btree (run_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_report_csv_artifacts_org_id
    ON public.report_csv_artifacts USING btree (organization_id ASC NULLS LAST);
