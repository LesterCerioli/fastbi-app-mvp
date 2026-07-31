-- Table: public.agent_tasks

-- DROP TABLE IF EXISTS public.agent_tasks;

CREATE TABLE IF NOT EXISTS public.agent_tasks
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    task_type character varying(50) COLLATE pg_catalog."default" NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'pending'::character varying,
    priority integer DEFAULT 5,
    input_params jsonb NOT NULL,
    output_result jsonb,
    error_message text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    CONSTRAINT agent_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT agent_tasks_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.agent_tasks
    OWNER to postgres;
-- Index: idx_agent_tasks_created

-- DROP INDEX IF EXISTS public.idx_agent_tasks_created;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_created
    ON public.agent_tasks USING btree
    (created_at ASC NULLS LAST)
    TABLESPACE pg_default
    WHERE status::text = 'pending'::text;
-- Index: idx_agent_tasks_org_status

-- DROP INDEX IF EXISTS public.idx_agent_tasks_org_status;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_org_status
    ON public.agent_tasks USING btree
    (organization_id ASC NULLS LAST, status COLLATE pg_catalog."default" ASC NULLS LAST, priority DESC NULLS FIRST)
    TABLESPACE pg_default;