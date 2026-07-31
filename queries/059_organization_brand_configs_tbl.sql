CREATE TABLE IF NOT EXISTS public.organization_brand_configs
(
    id                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
    organization_id      uuid                     NOT NULL,
    logo_url             text,
    primary_color        character varying(7)     NOT NULL DEFAULT '#1A73E8',
    accent_color         character varying(7)     NOT NULL DEFAULT '#34A853',
    tenant_name          character varying(255)   NOT NULL,
    report_title_template character varying(500),
    report_period        character varying(100),
    created_at           timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT organization_brand_configs_pkey PRIMARY KEY (id),

    -- One brand config per organization
    CONSTRAINT organization_brand_configs_org_id_unique UNIQUE (organization_id),

    CONSTRAINT organization_brand_configs_org_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.organization_brand_configs
    OWNER to postgres;

CREATE INDEX IF NOT EXISTS idx_org_brand_configs_org_id
    ON public.organization_brand_configs USING btree (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
