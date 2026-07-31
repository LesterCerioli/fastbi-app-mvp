CREATE TABLE public.agent_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trigger_signature TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    outcome_success FLOAT DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_patterns_org_trigger ON agent_patterns(organization_id, trigger_signature);
CREATE INDEX idx_agent_patterns_effectiveness ON agent_patterns(effectiveness_score DESC) WHERE effectiveness_score > 0;