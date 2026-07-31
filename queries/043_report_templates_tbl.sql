-- Table: public.report_templates

-- DROP TABLE IF EXISTS public.report_templates;

CREATE TABLE IF NOT EXISTS public.report_templates
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    category character varying(100) COLLATE pg_catalog."default",
    export_format character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pdf'::character varying,
    language character varying(10) COLLATE pg_catalog."default" NOT NULL DEFAULT 'en'::character varying,
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_by character varying(255) COLLATE pg_catalog."default",
    updated_by character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT report_templates_pkey PRIMARY KEY (id),
    CONSTRAINT report_templates_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_templates
    OWNER to postgres;
-- Index: idx_report_templates_active

-- DROP INDEX IF EXISTS public.idx_report_templates_active;

CREATE INDEX IF NOT EXISTS idx_report_templates_active
    ON public.report_templates USING btree
    (organization_id ASC NULLS LAST, is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_report_templates_org_id

-- DROP INDEX IF EXISTS public.idx_report_templates_org_id;

CREATE INDEX IF NOT EXISTS idx_report_templates_org_id
    ON public.report_templates USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;