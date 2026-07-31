CREATE TABLE IF NOT EXISTS public.report_artifacts
(
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Sua nova PK padrão
    job_id uuid NOT NULL,                        -- Continua sendo o vínculo com a fila
    organization_id uuid NOT NULL,
    file_bytes bytea NOT NULL,
    file_size_bytes bigint NOT NULL,
    file_name character varying(255) NOT NULL,
    rendered_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT report_artifacts_pkey PRIMARY KEY (id), -- Definido aqui como PK
    
    -- CRUCIAL: Garante que um Job só tenha UM único PDF gerado (Relação 1 para 1)
    CONSTRAINT report_artifacts_job_id_unique UNIQUE (job_id), 
    
    CONSTRAINT report_artifacts_job_id_fkey FOREIGN KEY (job_id)
        REFERENCES public.report_jobs (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
        
    CONSTRAINT report_artifacts_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.report_artifacts
    OWNER to postgres;

CREATE INDEX IF NOT EXISTS idx_report_artifacts_org_id
    ON public.report_artifacts USING btree (organization_id ASC NULLS LAST);