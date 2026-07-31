-- Table: public.sales_records

-- DROP TABLE IF EXISTS public.sales_records;

CREATE TABLE IF NOT EXISTS public.sales_records
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    date date NOT NULL,
    category character varying(100) COLLATE pg_catalog."default",
    product_id character varying(100) COLLATE pg_catalog."default",
    region character varying(100) COLLATE pg_catalog."default",
    channel character varying(100) COLLATE pg_catalog."default",
    customer_segment character varying(100) COLLATE pg_catalog."default",
    quantity integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_records_pkey PRIMARY KEY (id),
    CONSTRAINT fk_sales_records_organization FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sales_records
    OWNER to postgres;
-- Index: idx_sales_records_category

-- DROP INDEX IF EXISTS public.idx_sales_records_category;

CREATE INDEX IF NOT EXISTS idx_sales_records_category
    ON public.sales_records USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_records_channel

-- DROP INDEX IF EXISTS public.idx_sales_records_channel;

CREATE INDEX IF NOT EXISTS idx_sales_records_channel
    ON public.sales_records USING btree
    (channel COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_records_customer_segment

-- DROP INDEX IF EXISTS public.idx_sales_records_customer_segment;

CREATE INDEX IF NOT EXISTS idx_sales_records_customer_segment
    ON public.sales_records USING btree
    (customer_segment COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_records_organization_date

-- DROP INDEX IF EXISTS public.idx_sales_records_organization_date;

CREATE INDEX IF NOT EXISTS idx_sales_records_organization_date
    ON public.sales_records USING btree
    (organization_id ASC NULLS LAST, date ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sales_records_region

-- DROP INDEX IF EXISTS public.idx_sales_records_region;

CREATE INDEX IF NOT EXISTS idx_sales_records_region
    ON public.sales_records USING btree
    (region COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: update_sales_records_updated_at

-- DROP TRIGGER IF EXISTS update_sales_records_updated_at ON public.sales_records;

CREATE OR REPLACE TRIGGER update_sales_records_updated_at
    BEFORE UPDATE 
    ON public.sales_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();