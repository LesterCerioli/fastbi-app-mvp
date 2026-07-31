CREATE TABLE IF NOT EXISTS public.report_runs (
	    id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
	    organization_id  uuid        NOT NULL,
	    schedule_id      uuid,
	    job_id           uuid,
	    status           varchar(30) NOT NULL DEFAULT 'scheduled',
	    current_stage    varchar(30) NOT NULL DEFAULT 'scheduled',
	    stage_started_at timestamptz,
	    stage_metadata   jsonb,
	    created_at       timestamptz NOT NULL DEFAULT NOW(),
	    delivered_at     timestamptz,
	    error_details    text
	);

	CREATE INDEX IF NOT EXISTS idx_report_runs_org    ON report_runs(organization_id);
	CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);

	CREATE TABLE IF NOT EXISTS public.report_run_stages (
	    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
	    run_id      uuid        NOT NULL REFERENCES report_runs(id) ON DELETE CASCADE,
	    status      varchar(30) NOT NULL,
	    entered_at  timestamptz NOT NULL DEFAULT NOW(),
	    exited_at   timestamptz,
	    duration_ms bigint,
	    metadata    jsonb
	);

	CREATE INDEX IF NOT EXISTS idx_run_stages_run_id ON report_run_stages(run_id);