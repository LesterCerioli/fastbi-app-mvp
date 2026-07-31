ALTER TABLE IF EXISTS public.accounting_workflow_templates
  ADD COLUMN IF NOT EXISTS workflow_definition jsonb;

ALTER TABLE IF EXISTS public.accounting_workflow_templates
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE IF EXISTS public.accounting_workflow_templates
  ADD COLUMN IF NOT EXISTS tags text[];

ALTER TABLE IF EXISTS public.accounting_workflow_templates
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_accounting_templates_workflow_definition_gin
  ON public.accounting_workflow_templates USING gin
  (workflow_definition);
