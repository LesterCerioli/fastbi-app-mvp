-- Table: public.customers

-- DROP TABLE IF EXISTS public.customers;

CREATE TABLE IF NOT EXISTS public.customers
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    customer_code character varying(100) COLLATE pg_catalog."default" NOT NULL,
    legal_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    trade_name character varying(200) COLLATE pg_catalog."default",
    customer_tier character varying(50) COLLATE pg_catalog."default" NOT NULL,
    customer_type character varying(50) COLLATE pg_catalog."default",
    industry character varying(100) COLLATE pg_catalog."default",
    region character varying(100) COLLATE pg_catalog."default",
    state character varying(50) COLLATE pg_catalog."default",
    city character varying(100) COLLATE pg_catalog."default",
    account_manager_id uuid,
    account_manager_name character varying(200) COLLATE pg_catalog."default",
    lifetime_value numeric(20,4),
    average_margin_percent numeric(10,4),
    first_purchase_date date,
    last_purchase_date date,
    is_active boolean DEFAULT true,
    risk_level character varying(20) COLLATE pg_catalog."default" DEFAULT 'low'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_org_code_unique UNIQUE (organization_id, customer_code),
    CONSTRAINT customers_account_manager_id_fkey FOREIGN KEY (account_manager_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.customers
    OWNER to postgres;
-- Index: idx_customers_organization

-- DROP INDEX IF EXISTS public.idx_customers_organization;

CREATE INDEX IF NOT EXISTS idx_customers_organization
    ON public.customers USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_customers_region

-- DROP INDEX IF EXISTS public.idx_customers_region;

CREATE INDEX IF NOT EXISTS idx_customers_region
    ON public.customers USING btree
    (organization_id ASC NULLS LAST, region COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_customers_tier

-- DROP INDEX IF EXISTS public.idx_customers_tier;

CREATE INDEX IF NOT EXISTS idx_customers_tier
    ON public.customers USING btree
    (organization_id ASC NULLS LAST, customer_tier COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;