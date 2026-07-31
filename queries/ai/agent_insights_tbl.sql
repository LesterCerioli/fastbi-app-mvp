CREATE TABLE public.agent_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP
);

CREATE INDEX idx_agent_insights_org_created ON agent_insights(organization_id, created_at DESC);
CREATE INDEX idx_agent_insights_severity ON agent_insights(severity) WHERE is_dismissed = FALSE;