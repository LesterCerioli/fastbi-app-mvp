CREATE TABLE public.agent_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,
    dimension_name VARCHAR(50),
    dimension_value VARCHAR(100),
    expected_value FLOAT NOT NULL,
    actual_value FLOAT NOT NULL,
    deviation_zscore FLOAT NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolution_action TEXT
);

CREATE INDEX idx_agent_anomalies_org_metric ON agent_anomalies(organization_id, metric_name, detected_at DESC);
CREATE INDEX idx_agent_anomalies_zscore ON agent_anomalies(deviation_zscore DESC) WHERE resolved_at IS NULL;