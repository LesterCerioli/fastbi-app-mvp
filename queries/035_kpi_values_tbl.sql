-- Table: public.kpi_values

-- DROP TABLE IF EXISTS public.kpi_values;

CREATE TABLE IF NOT EXISTS public.kpi_values
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    kpi_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    actual_value numeric(20,4) NOT NULL,
    target_value numeric(20,4),
    variance_percentage numeric(10,2),
    achieved_target boolean,
    calculation_date date NOT NULL,
    calculated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    region character varying(100) COLLATE pg_catalog."default",
    department character varying(100) COLLATE pg_catalog."default",
    business_unit character varying(100) COLLATE pg_catalog."default",
    product_line character varying(100) COLLATE pg_catalog."default",
    customer_segment character varying(100) COLLATE pg_catalog."default",
    calculation_context jsonb,
    data_quality_score numeric(5,2),
    notes text COLLATE pg_catalog."default",
    CONSTRAINT kpi_values_pkey PRIMARY KEY (id),
    CONSTRAINT kpi_values_kpi_id_fkey FOREIGN KEY (kpi_id)
        REFERENCES public.kpis (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT kpi_values_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.kpi_values
    OWNER to postgres;
-- Index: idx_kpi_values_calculation_date

-- DROP INDEX IF EXISTS public.idx_kpi_values_calculation_date;

CREATE INDEX IF NOT EXISTS idx_kpi_values_calculation_date
    ON public.kpi_values USING btree
    (calculation_date ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_kpi_values_kpi_date

-- DROP INDEX IF EXISTS public.idx_kpi_values_kpi_date;

CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_date
    ON public.kpi_values USING btree
    (kpi_id ASC NULLS LAST, calculation_date DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_kpi_values_org_date

-- DROP INDEX IF EXISTS public.idx_kpi_values_org_date;

CREATE INDEX IF NOT EXISTS idx_kpi_values_org_date
    ON public.kpi_values USING btree
    (organization_id ASC NULLS LAST, calculation_date DESC NULLS FIRST)
    TABLESPACE pg_default;