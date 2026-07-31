CREATE TABLE IF NOT EXISTS public.financial_transactions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    product_id uuid,
    customer_id uuid,
    sales_rep_id uuid,
    transaction_date timestamp with time zone NOT NULL,
    transaction_type character varying(50) COLLATE pg_catalog."default" NOT NULL,
    invoice_number character varying(100) COLLATE pg_catalog."default",
    amount_usd numeric(20,4) NOT NULL,
    original_amount numeric(20,4),
    original_currency character varying(3) COLLATE pg_catalog."default",
    exchange_rate numeric(10,6),
    quantity numeric(10,2) DEFAULT 1,
    unit_price_usd numeric(20,4),
    cogs_direct_material numeric(20,4) DEFAULT 0,
    cogs_direct_labor numeric(20,4) DEFAULT 0,
    cogs_manufacturing numeric(20,4) DEFAULT 0,
    cogs_freight_in numeric(20,4) DEFAULT 0,
    cogs_royalties numeric(20,4) DEFAULT 0,
    variable_commission numeric(20,4) DEFAULT 0,
    variable_shipping numeric(20,4) DEFAULT 0,
    variable_payment_fees numeric(20,4) DEFAULT 0,
    variable_packaging numeric(20,4) DEFAULT 0,
    fixed_direct_allocated numeric(20,4) DEFAULT 0,
    total_cogs numeric(20,4) GENERATED ALWAYS AS (((((((((cogs_direct_material + cogs_direct_labor) + cogs_manufacturing) + cogs_freight_in) + cogs_royalties) + variable_commission) + variable_shipping) + variable_payment_fees) + variable_packaging)) STORED,
    transaction_margin_percent numeric(10,4) GENERATED ALWAYS AS (
CASE
    WHEN (amount_usd > (0)::numeric) THEN (((amount_usd - ((((((((cogs_direct_material + cogs_direct_labor) + cogs_manufacturing) + cogs_freight_in) + cogs_royalties) + variable_commission) + variable_shipping) + variable_payment_fees) + variable_packaging)) / amount_usd) * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    product_name character varying(200) COLLATE pg_catalog."default",
    product_category character varying(100) COLLATE pg_catalog."default",
    product_sku character varying(100) COLLATE pg_catalog."default",
    customer_name character varying(200) COLLATE pg_catalog."default",
    customer_tier character varying(50) COLLATE pg_catalog."default",
    region character varying(100) COLLATE pg_catalog."default",
    state character varying(50) COLLATE pg_catalog."default",
    city character varying(100) COLLATE pg_catalog."default",
    channel character varying(100) COLLATE pg_catalog."default",
    sales_rep_name character varying(200) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT financial_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT financial_transactions_customer_id_fkey FOREIGN KEY (customer_id)
        REFERENCES public.customers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT financial_transactions_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT financial_transactions_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.products (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT financial_transactions_sales_rep_id_fkey FOREIGN KEY (sales_rep_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT fk_customer FOREIGN KEY (customer_id)
        REFERENCES public.customers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT fk_product FOREIGN KEY (product_id)
        REFERENCES public.products (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.financial_transactions
    OWNER to postgres;
-- Index: idx_financial_transactions_channel

-- DROP INDEX IF EXISTS public.idx_financial_transactions_channel;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_channel
    ON public.financial_transactions USING btree
    (organization_id ASC NULLS LAST, channel COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_financial_transactions_customer

-- DROP INDEX IF EXISTS public.idx_financial_transactions_customer;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_customer
    ON public.financial_transactions USING btree
    (organization_id ASC NULLS LAST, customer_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_financial_transactions_margin

-- DROP INDEX IF EXISTS public.idx_financial_transactions_margin;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_margin
    ON public.financial_transactions USING btree
    (organization_id ASC NULLS LAST, transaction_margin_percent ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_financial_transactions_org_date

-- DROP INDEX IF EXISTS public.idx_financial_transactions_org_date;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_date
    ON public.financial_transactions USING btree
    (organization_id ASC NULLS LAST, transaction_date ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_financial_transactions_product

-- DROP INDEX IF EXISTS public.idx_financial_transactions_product;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_product
    ON public.financial_transactions USING btree
    (organization_id ASC NULLS LAST, product_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_financial_transactions_region

-- DROP INDEX IF EXISTS public.idx_financial_transactions_region;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_region
    ON public.financial_transactions USING btree
    (organization_id ASC NULLS LAST, region COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;