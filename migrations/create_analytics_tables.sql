-- Analytics tables for live dashboard (traffic + system health)

CREATE TABLE IF NOT EXISTS public.traffic_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'organic',
  page_views BIGINT NOT NULL DEFAULT 0,
  unique_visitors BIGINT NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2),
  avg_session_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, metric_date, channel)
);

CREATE INDEX IF NOT EXISTS idx_traffic_analytics_org_date
  ON public.traffic_analytics (organization_id, metric_date);

CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_name TEXT,
  status TEXT,
  uptime_percent NUMERIC(5,2),
  response_time_ms INTEGER,
  cpu_usage_percent NUMERIC(5,2),
  memory_usage_percent NUMERIC(5,2),
  disk_usage_percent NUMERIC(5,2),
  network_usage_percent NUMERIC(5,2)
);

CREATE INDEX IF NOT EXISTS idx_system_health_org_service
  ON public.system_health_metrics (organization_id, service_name, collected_at DESC);

-- Sample data for GCico LTDA (last 30 days, includes today)
DO $$
DECLARE
  v_org_id UUID;
  v_day DATE;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE name = 'GCico LTDA';
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Organization GCico LTDA not found; skipping analytics seed';
    RETURN;
  END IF;

  FOR v_day IN
    SELECT (CURRENT_DATE - s)::date FROM generate_series(29, 0) AS s
  LOOP
    INSERT INTO public.traffic_analytics
      (organization_id, metric_date, channel, page_views, unique_visitors, bounce_rate, avg_session_seconds)
    VALUES
      (v_org_id, v_day, 'organic', 1100 + (random() * 900)::int, 700 + (random() * 500)::int, 30 + (random() * 14), 120 + (random() * 60)::int),
      (v_org_id, v_day, 'direct',   500 + (random() * 500)::int, 320 + (random() * 300)::int, 38 + (random() * 16), 90 + (random() * 50)::int),
      (v_org_id, v_day, 'referral', 180 + (random() * 220)::int, 120 + (random() * 140)::int, 24 + (random() * 14), 150 + (random() * 70)::int),
      (v_org_id, v_day, 'social',   260 + (random() * 340)::int, 180 + (random() * 220)::int, 46 + (random() * 18), 65 + (random() * 40)::int)
    ON CONFLICT (organization_id, metric_date, channel) DO NOTHING;
  END LOOP;

  INSERT INTO public.system_health_metrics
    (organization_id, collected_at, service_name, status, uptime_percent, response_time_ms)
  VALUES
    (v_org_id, now() - interval '10 minutes', 'api_server',   'online',  99.90, 145),
    (v_org_id, now() - interval '10 minutes', 'database',     'online',  99.98, 12),
    (v_org_id, now() - interval '10 minutes', 'cache_layer',  'online',  99.95, 3),
    (v_org_id, now() - interval '10 minutes', 'queue_worker', 'online',  99.70, 210),
    (v_org_id, now() - interval '10 minutes', 'websocket',    'degraded', 98.50, 340);

  INSERT INTO public.system_health_metrics
    (organization_id, collected_at, cpu_usage_percent, memory_usage_percent, disk_usage_percent, network_usage_percent)
  VALUES
    (v_org_id, now(), 42.00, 68.00, 54.00, 35.00);
END $$;