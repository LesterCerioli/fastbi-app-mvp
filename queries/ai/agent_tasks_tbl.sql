CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INT DEFAULT 5,
    input_params JSONB NOT NULL,
    output_result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_agent_tasks_org_status ON agent_tasks(organization_id, status, priority DESC);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at) WHERE status = 'pending';
