CREATE TABLE IF NOT EXISTS public.saved_queries (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
			connection_id UUID NOT NULL REFERENCES public.client_database_connections(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			query_text TEXT NOT NULL,
			description TEXT,
			category VARCHAR(100),
			execution_count INTEGER DEFAULT 0,
			last_executed_at TIMESTAMPTZ,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);