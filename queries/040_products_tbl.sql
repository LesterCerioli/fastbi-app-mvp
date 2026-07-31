-- Table: public.products

-- DROP TABLE IF EXISTS public.products;

CREATE TABLE IF NOT EXISTS public.products
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    sku character varying(100) COLLATE pg_catalog."default" NOT NULL,
    name character varying(200) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    product_category character varying(100) COLLATE pg_catalog."default" NOT NULL,
    product_subcategory character varying(100) COLLATE pg_catalog."default",
    product_family character varying(100) COLLATE pg_catalog."default",
    product_tier character varying(50) COLLATE pg_catalog."default",
    lifecycle_stage character varying(50) COLLATE pg_catalog."default" DEFAULT 'active'::character varying,
    standard_cost numeric(20,4),
    standard_price numeric(20,4),
    target_margin_percent numeric(5,2),
    cost_of_goods_sold numeric(20,4),
    cost_allocation_method character varying(50) COLLATE pg_catalog."default" DEFAULT 'per_unit'::character varying,
    parent_product_id uuid,
    bundle_components jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_org_sku_unique UNIQUE (organization_id, sku),
    CONSTRAINT products_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT products_parent_product_id_fkey FOREIGN KEY (parent_product_id)
        REFERENCES public.products (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.products
    OWNER to postgres;
-- Index: idx_products_category

-- DROP INDEX IF EXISTS public.idx_products_category;

CREATE INDEX IF NOT EXISTS idx_products_category
    ON public.products USING btree
    (organization_id ASC NULLS LAST, product_category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_products_lifecycle

-- DROP INDEX IF EXISTS public.idx_products_lifecycle;

CREATE INDEX IF NOT EXISTS idx_products_lifecycle
    ON public.products USING btree
    (organization_id ASC NULLS LAST, lifecycle_stage COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_products_organization

-- DROP INDEX IF EXISTS public.idx_products_organization;

CREATE INDEX IF NOT EXISTS idx_products_organization
    ON public.products USING btree
    (organization_id ASC NULLS LAST)
    TABLESPACE pg_default;