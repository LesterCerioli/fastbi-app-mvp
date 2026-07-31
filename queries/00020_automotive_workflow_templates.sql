-- Table: public.automotive_workflow_templates

-- DROP TABLE IF EXISTS public.automotive_workflow_templates;

CREATE TABLE IF NOT EXISTS public.automotive_workflow_templates
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    category character varying(100) COLLATE pg_catalog."default" NOT NULL,
    vehicle_category character varying(50) COLLATE pg_catalog."default",
    location_type character varying(50) COLLATE pg_catalog."default",
    insurance_required boolean DEFAULT true,
    structure_json jsonb NOT NULL,
    created_by character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT automotive_workflow_templates_pkey PRIMARY KEY (id),
    CONSTRAINT chk_automotive_templates_category CHECK (category::text = ANY (ARRAY['rental_reservation'::character varying, 'vehicle_checkout'::character varying, 'vehicle_return'::character varying, 'fleet_management'::character varying, 'maintenance_scheduling'::character varying, 'inspection'::character varying, 'damage_reporting'::character varying, 'insurance_processing'::character varying, 'customer_onboarding'::character varying, 'loyalty_program'::character varying, 'billing_invoicing'::character varying, 'fuel_management'::character varying, 'accident_handling'::character varying, 'late_return'::character varying, 'extension_request'::character varying, 'fleet_acquisition'::character varying, 'vehicle_disposal'::character varying, 'toll_management'::character varying, 'gps_tracking'::character varying, 'roadside_assistance'::character varying]::text[])),
    CONSTRAINT chk_automotive_templates_location_type CHECK (location_type::text = ANY (ARRAY['airport'::character varying, 'downtown'::character varying, 'suburban'::character varying, 'hotel'::character varying, 'railway_station'::character varying, 'city_center'::character varying, 'resort'::character varying, 'business_district'::character varying]::text[])),
    CONSTRAINT chk_automotive_templates_vehicle_category CHECK (vehicle_category::text = ANY (ARRAY['economy'::character varying, 'compact'::character varying, 'intermediate'::character varying, 'standard'::character varying, 'full_size'::character varying, 'premium'::character varying, 'luxury'::character varying, 'suv'::character varying, 'van'::character varying, 'truck'::character varying, 'convertible'::character varying, 'electric'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.automotive_workflow_templates
    OWNER to postgres;
-- Index: idx_automotive_templates_category

-- DROP INDEX IF EXISTS public.idx_automotive_templates_category;

CREATE INDEX IF NOT EXISTS idx_automotive_templates_category
    ON public.automotive_workflow_templates USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_templates_created_at

-- DROP INDEX IF EXISTS public.idx_automotive_templates_created_at;

CREATE INDEX IF NOT EXISTS idx_automotive_templates_created_at
    ON public.automotive_workflow_templates USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_templates_location_type

-- DROP INDEX IF EXISTS public.idx_automotive_templates_location_type;

CREATE INDEX IF NOT EXISTS idx_automotive_templates_location_type
    ON public.automotive_workflow_templates USING btree
    (location_type COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_templates_name

-- DROP INDEX IF EXISTS public.idx_automotive_templates_name;

CREATE INDEX IF NOT EXISTS idx_automotive_templates_name
    ON public.automotive_workflow_templates USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_automotive_templates_structure_gin

-- DROP INDEX IF EXISTS public.idx_automotive_templates_structure_gin;

CREATE INDEX IF NOT EXISTS idx_automotive_templates_structure_gin
    ON public.automotive_workflow_templates USING gin
    (structure_json)
    TABLESPACE pg_default;
-- Index: idx_automotive_templates_vehicle_category

-- DROP INDEX IF EXISTS public.idx_automotive_templates_vehicle_category;

CREATE INDEX IF NOT EXISTS idx_automotive_templates_vehicle_category
    ON public.automotive_workflow_templates USING btree
    (vehicle_category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;