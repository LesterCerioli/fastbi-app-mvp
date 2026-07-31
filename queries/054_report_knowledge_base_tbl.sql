-- Table: public.report_knowledge_base
-- Tracks indexed knowledge chunks per organization for tenant-scoped RAG retrieval.
-- Populated by ReportingRAGEngine via ForceReindex or event-driven ingestion triggers.

CREATE TABLE IF NOT EXISTS public.report_knowledge_base
(
    id              uuid         NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid         NOT NULL,
    source_type     varchar(30)  NOT NULL,
    source_ref      varchar(255) NOT NULL,
    content         text         NOT NULL,
    version         integer      NOT NULL DEFAULT 1,
    last_indexed_at timestamptz  NOT NULL DEFAULT NOW(),
    created_at      timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT report_knowledge_base_pkey PRIMARY KEY (id),
    CONSTRAINT report_knowledge_base_org_type_ref_key UNIQUE (organization_id, source_type, source_ref),
    CONSTRAINT report_knowledge_base_org_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_knowledge_base
    OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_rkb_organization_id
    ON public.report_knowledge_base USING btree (organization_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rkb_org_source_type
    ON public.report_knowledge_base USING btree (organization_id ASC NULLS LAST, source_type ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_rkb_last_indexed_at
    ON public.report_knowledge_base USING btree (last_indexed_at DESC NULLS FIRST);
