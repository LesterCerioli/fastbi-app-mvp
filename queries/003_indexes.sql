
CREATE INDEX idx_kpis_organization ON public.kpis(organization_id);

CREATE INDEX idx_kpis_org_status ON public.kpis(organization_id, status);

CREATE INDEX idx_kpis_org_category ON public.kpis(organization_id, category);

CREATE INDEX idx_kpis_updated_at ON public.kpis(updated_at);

CREATE INDEX idx_kpis_updated_at_active ON public.kpis(updated_at) WHERE status = 'active';

CREATE INDEX idx_kpi_history_kpi_id ON public.kpi_history(kpi_id);

CREATE INDEX idx_kpi_history_changed_at ON public.kpi_history(changed_at DESC);

CREATE INDEX idx_kpi_history_org_kpi_version ON public.kpi_history(organization_id, kpi_id, version DESC);

CREATE INDEX idx_kpi_values_kpi_date ON public.kpi_values(kpi_id, calculation_date DESC);

CREATE INDEX idx_kpi_values_org_date ON public.kpi_values(organization_id, calculation_date DESC);

CREATE INDEX idx_kpi_values_calculation_date ON public.kpi_values(calculation_date);

CREATE INDEX idx_kpis_calculation_schema ON public.kpis USING GIN (calculation_schema);

CREATE INDEX idx_kpis_view_permissions ON public.kpis USING GIN (view_permissions);

CREATE INDEX idx_kpis_applicable_regions ON public.kpis USING GIN (applicable_regions);