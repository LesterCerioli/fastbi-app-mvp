"use client";

import { useState, useEffect, useCallback } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import CreateClientConnection from "@/components/data_eng/clientconnection/createClientConnection/createClientConnection";

interface Migration {
  id: string;
  organization_id: string;
  source_connection_id: string;
  target_connection_id: string;
  source_db_type: string;
  target_db_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  tables_total: number;
  tables_completed: number;
  rows_migrated: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  source_name?: string;
  target_name?: string;
}

interface Connection {
  id: string;
  connection_name: string;
  db_type: string;
  host: string;
  port: number;
  database_name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  max_rows_limit: number;
  query_timeout_seconds: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  completed: { bg: "#052e16", text: "#4ade80", border: "#166534" },
  running: { bg: "#1e3a5f", text: "#60a5fa", border: "#2563eb" },
  pending: { bg: "#3f3d1a", text: "#facc15", border: "#854d0e" },
  failed: { bg: "#450a0a", text: "#f87171", border: "#991b1b" },
  cancelled: { bg: "#262626", text: "#a3a3a3", border: "#525252" },
};

async function getFreshToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  return data.token;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MigrationsPage() {
  const { t } = useTranslations();
  const [orgName, setOrgName] = useState<string>("");
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [isLoadingMigrations, setIsLoadingMigrations] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Available connections for dropdown selectors
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  // Source/Target connection state
  const [sourceConnectionId, setSourceConnectionId] = useState("");
  const [sourceConnectionName, setSourceConnectionName] = useState("");
  const [targetConnectionId, setTargetConnectionId] = useState("");
  const [targetConnectionName, setTargetConnectionName] = useState("");

  // Migration options
  const [includeIndexes, setIncludeIndexes] = useState(true);
  const [includeForeignKeys, setIncludeForeignKeys] = useState(true);

  // Form state
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Refresh keys to reload connection lists after creation
  const [sourceRefreshKey, setSourceRefreshKey] = useState(0);
  const [targetRefreshKey, setTargetRefreshKey] = useState(0);

  // Detail modal
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null);

  // Real-time polling for running migrations
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [watchedMigrationId, setWatchedMigrationId] = useState<string | null>(null);

  // Load org name from sessionStorage on client side only
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("organization_name") || "";
        setOrgName(stored);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchMigrations = useCallback(async () => {
    if (!orgName) return;
    setIsLoadingMigrations(true);
    try {
      const token = await getFreshToken();
      const params = new URLSearchParams({
        organization_name: orgName,
        limit: "50",
        offset: "0",
      });
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const res = await fetch(`/api/dataeng/migrations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load migrations");
      setMigrations(data.migrations || []);
    } catch (err) {
      console.error("Failed to load migrations:", err);
    } finally {
      setIsLoadingMigrations(false);
    }
  }, [orgName, selectedStatus]);

  const fetchConnections = useCallback(async () => {
    if (!orgName) return;
    setIsLoadingConnections(true);
    try {
      const token = await getFreshToken();
      const res = await fetch(`/api/dataeng/clientconn?organization_name=${encodeURIComponent(orgName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load connections");
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setIsLoadingConnections(false);
    }
  }, [orgName]);

  useEffect(() => {
    if (orgName) {
      const timer = setTimeout(() => {
        fetchMigrations();
        fetchConnections();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [orgName, fetchMigrations, fetchConnections]);

  const handleSourceSelect = (connectionId: string, connectionName: string) => {
    setSourceConnectionId(connectionId);
    setSourceConnectionName(connectionName);
  };

  const handleTargetSelect = (connectionId: string, connectionName: string) => {
    setTargetConnectionId(connectionId);
    setTargetConnectionName(connectionName);
  };

  const handleCreateMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!sourceConnectionId || !targetConnectionId) {
      setCreateError("Please select or create both source and target connections");
      return;
    }

    if (sourceConnectionId === targetConnectionId) {
      setCreateError("Source and target connections must be different");
      return;
    }

    setIsCreating(true);
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/dataeng/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: orgName,
          source_connection_id: sourceConnectionId,
          target_connection_id: targetConnectionId,
          options: {
            include_indexes: includeIndexes,
            include_foreign_keys: includeForeignKeys,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create migration");

      setCreateSuccess("Migration created successfully! Starting...");
      fetchMigrations();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartMigration = async (migrationId: string) => {
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/dataeng/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "start", migration_id: migrationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start migration");
      fetchMigrations();
      startPolling(migrationId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleCancelMigration = async (migrationId: string) => {
    if (!confirm("Are you sure you want to cancel this migration?")) return;
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/dataeng/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "cancel", migration_id: migrationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel migration");
      stopPolling();
      fetchMigrations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleRetryMigration = async (migrationId: string) => {
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/dataeng/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "retry", migration_id: migrationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retry migration");
      fetchMigrations();
      startPolling(migrationId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const fetchSingleMigration = async (migrationId: string) => {
    try {
      const token = await getFreshToken();
      const res = await fetch(`/api/dataeng/migrations?migration_id=${migrationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data) {
        setMigrations(prev => prev.map(m => m.id === migrationId ? data : m));
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch migration:", err);
    }
    return null;
  };

  const startPolling = useCallback((migrationId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    setWatchedMigrationId(migrationId);
    const interval = setInterval(() => {
      fetchSingleMigration(migrationId).then(migration => {
        if (migration && (migration.status === 'completed' || migration.status === 'failed' || migration.status === 'cancelled')) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
            setWatchedMigrationId(null);
          }
        }
      });
    }, 2000);
    setPollingInterval(interval);
  }, [pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setWatchedMigrationId(null);
    }
  }, [pollingInterval]);

  const handleViewDetails = (migration: Migration) => {
    setSelectedMigration(migration);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Auto-start polling for any running migrations on load
  useEffect(() => {
    const runningMigration = migrations.find(m => m.status === 'running');
    if (runningMigration && !watchedMigrationId) {
      startPolling(runningMigration.id);
    }
  }, [migrations, watchedMigrationId, startPolling]);

  const getSourceLabel = (migration: Migration) => {
    if (migration.source_name) return migration.source_name;
    return migration.source_connection_id.slice(0, 8);
  };

  const getTargetLabel = (migration: Migration) => {
    if (migration.target_name) return migration.target_name;
    return migration.target_connection_id.slice(0, 8);
  };

  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.BackLink href="/dataeng/databases">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Databases</span>
          </S.BackLink>
          <S.SectionTitle>Database Migrations</S.SectionTitle>
          <S.SectionSubtitle>
            Migrate data between databases. Create or select source and target connections.
          </S.SectionSubtitle>
        </S.SectionHead>

        {!orgName && (
          <S.EmptyState>
            <S.EmptyIcon>🏢</S.EmptyIcon>
            <S.EmptyText>{t("dataeng.connections.noOrg")}</S.EmptyText>
            <S.OrgInputInline
              type="text"
              placeholder={t("dataeng.connections.orgPlaceholder")}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </S.EmptyState>
        )}

        {orgName && (
          <>
            <S.Card>
              <S.CardHeader>
                <S.CardTitle>Source Database (Origin)</S.CardTitle>
              </S.CardHeader>
              <S.CardContent>
                <CreateClientConnection
                  organizationName={orgName}
                  refreshKey={sourceRefreshKey}
                  onSuccess={() => setSourceRefreshKey(k => k + 1)}
                  onSelect={handleSourceSelect}
                />
                {sourceConnectionId && (
                  <S.SelectedConnection>
                    <S.CheckIcon>✓</S.CheckIcon>
                    <span>Selected: <strong>{sourceConnectionName}</strong></span>
                    <S.ClearButton onClick={() => { setSourceConnectionId(""); setSourceConnectionName(""); }}>
                      Clear
                    </S.ClearButton>
                  </S.SelectedConnection>
                )}
              </S.CardContent>
            </S.Card>

            <S.Card>
              <S.CardHeader>
                <S.CardTitle>Target Database (Destination)</S.CardTitle>
              </S.CardHeader>
              <S.CardContent>
                <CreateClientConnection
                  organizationName={orgName}
                  refreshKey={targetRefreshKey}
                  onSuccess={() => setTargetRefreshKey(k => k + 1)}
                  onSelect={handleTargetSelect}
                />
                {targetConnectionId && (
                  <S.SelectedConnection>
                    <S.CheckIcon>✓</S.CheckIcon>
                    <span>Selected: <strong>{targetConnectionName}</strong></span>
                    <S.ClearButton onClick={() => { setTargetConnectionId(""); setTargetConnectionName(""); }}>
                      Clear
                    </S.ClearButton>
                  </S.SelectedConnection>
                )}
              </S.CardContent>
            </S.Card>

            <S.Card>
              <S.CardHeader>
                <S.CardTitle>Migration Options</S.CardTitle>
              </S.CardHeader>
              <S.CardContent>
                <S.SelectedConnectionsSummary>
                  <S.SummaryItem>
                    <S.SummaryLabel>Source Database</S.SummaryLabel>
                    <S.SummaryValue>
                      {sourceConnectionName || (
                        <span style={{ color: "#6b8a8a" }}>Not selected</span>
                      )}
                      {sourceConnectionId && (
                        <S.SummaryMeta>
                          {sourceConnectionName && <span>•</span>}
                          <span>ID: {sourceConnectionId.slice(0, 8)}...</span>
                        </S.SummaryMeta>
                      )}
                    </S.SummaryValue>
                  </S.SummaryItem>
                  <S.ArrowIcon>→</S.ArrowIcon>
                  <S.SummaryItem>
                    <S.SummaryLabel>Target Database</S.SummaryLabel>
                    <S.SummaryValue>
                      {targetConnectionName || (
                        <span style={{ color: "#6b8a8a" }}>Not selected</span>
                      )}
                      {targetConnectionId && (
                        <S.SummaryMeta>
                          {targetConnectionName && <span>•</span>}
                          <span>ID: {targetConnectionId.slice(0, 8)}...</span>
                        </S.SummaryMeta>
                      )}
                    </S.SummaryValue>
                  </S.SummaryItem>
                </S.SelectedConnectionsSummary>

                <S.ConnectionSelectors>
                  <S.SelectorGroup>
                    <S.SelectorLabel>Source Connection</S.SelectorLabel>
                    <S.ConnectionSelect
                      value={sourceConnectionId}
                      onChange={(e) => {
                        const connId = e.target.value;
                        const conn = connections.find(c => c.id === connId);
                        setSourceConnectionId(connId);
                        setSourceConnectionName(conn?.connection_name || "");
                      }}
                      disabled={isLoadingConnections}
                    >
                      <option value="">Select source connection...</option>
                      {connections.map((conn) => (
                        <option key={conn.id} value={conn.id}>
                          {conn.connection_name} ({conn.db_type} - {conn.host}:{conn.port}/{conn.database_name})
                        </option>
                      ))}
                    </S.ConnectionSelect>
                    {isLoadingConnections && <S.LoadingConnections>Loading connections...</S.LoadingConnections>}
                  </S.SelectorGroup>

                  <S.ArrowIcon>→</S.ArrowIcon>

                  <S.SelectorGroup>
                    <S.SelectorLabel>Target Connection</S.SelectorLabel>
                    <S.ConnectionSelect
                      value={targetConnectionId}
                      onChange={(e) => {
                        const connId = e.target.value;
                        const conn = connections.find(c => c.id === connId);
                        setTargetConnectionId(connId);
                        setTargetConnectionName(conn?.connection_name || "");
                      }}
                      disabled={isLoadingConnections}
                    >
                      <option value="">Select target connection...</option>
                      {connections.map((conn) => (
                        <option key={conn.id} value={conn.id}>
                          {conn.connection_name} ({conn.db_type} - {conn.host}:{conn.port}/{conn.database_name})
                        </option>
                      ))}
                    </S.ConnectionSelect>
                    {isLoadingConnections && <S.LoadingConnections>Loading connections...</S.LoadingConnections>}
                  </S.SelectorGroup>
                </S.ConnectionSelectors>

                <S.OptionsRow>
                  <S.CheckboxGroup>
                    <label>
                      <input
                        type="checkbox"
                        checked={includeIndexes}
                        onChange={(e) => setIncludeIndexes(e.target.checked)}
                      />
                      <span>Include indexes</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={includeForeignKeys}
                        onChange={(e) => setIncludeForeignKeys(e.target.checked)}
                      />
                      <span>Include foreign keys</span>
                    </label>
                  </S.CheckboxGroup>
                </S.OptionsRow>

                <S.InfoNotice>
                  <S.InfoIcon>ℹ️</S.InfoIcon>
                  <span>
                    This migration will copy the complete database structure and all table data from source to target.
                    Existing tables and data in the target database will be preserved (no deletion).
                    New tables will be created, and data will be inserted with conflict resolution to avoid duplicates.
                  </span>
                </S.InfoNotice>

                {createError && <S.ErrorMessage>{createError}</S.ErrorMessage>}
                {createSuccess && <S.SuccessMessage>{createSuccess}</S.SuccessMessage>}

                <S.FormActions>
                  <S.Button type="button" $variant="primary" onClick={handleCreateMigration} disabled={isCreating || !sourceConnectionId || !targetConnectionId || sourceConnectionId === targetConnectionId}>
                    {isCreating ? (
                      <>
                        <S.Spinner /> Creating Migration...
                      </>
                    ) : (
                      "Create Migration"
                    )}
                  </S.Button>
                </S.FormActions>
              </S.CardContent>
            </S.Card>

            <S.Card>
              <S.CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <S.CardTitle>Migration History</S.CardTitle>
                  <S.StatusFilter>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="running">Running</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </S.StatusFilter>
                </div>
              </S.CardHeader>
              <S.CardContent>
                {isLoadingMigrations ? (
                  <S.LoadingWrapper>
                    <S.Spinner />
                    <S.LoadingText>Loading migrations...</S.LoadingText>
                  </S.LoadingWrapper>
                ) : migrations.length === 0 ? (
                  <S.EmptyState>
                    <S.EmptyIcon>📋</S.EmptyIcon>
                    <S.EmptyText>No migrations found</S.EmptyText>
                  </S.EmptyState>
                ) : (
                  <S.MigrationTableWrapper>
                    <S.MigrationTable>
                      <thead>
                      <tr>
                        <th>Source → Target</th>
                        <th>DBMS</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Rows</th>
                        <th>Date/Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {migrations.map((migration) => {
                        const isWatched = watchedMigrationId === migration.id;
                        return (
                          <tr
                            key={migration.id}
                            onClick={() => handleViewDetails(migration)}
                            style={{
                              cursor: "pointer",
                              backgroundColor: isWatched ? "rgba(34, 197, 94, 0.08)" : undefined,
                              borderLeft: isWatched ? "3px solid #22c55e" : undefined,
                            }}
                          >
                          <td>
                            <div className="migration-path">
                              <span className="source">{getSourceLabel(migration)}</span>
                              <span className="arrow">→</span>
                              <span className="target">{getTargetLabel(migration)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="dbms-pair">
                              <span className="source-dbms">{migration.source_db_type}</span>
                              <span className="arrow">→</span>
                              <span className="target-dbms">{migration.target_db_type}</span>
                            </div>
                          </td>
                          <td>
                            <S.StatusBadge $bg={STATUS_COLORS[migration.status].bg} $text={STATUS_COLORS[migration.status].text} $border={STATUS_COLORS[migration.status].border}>
                              {migration.status.charAt(0).toUpperCase() + migration.status.slice(1)}
                              {isWatched && migration.status === 'running' && (
                                <S.LiveIndicator />
                              )}
                            </S.StatusBadge>
                          </td>
                          <td>
                            {migration.tables_total > 0 && (
                              <S.ProgressBar>
                                <S.ProgressFill
                                  style={{
                                    width: `${(migration.tables_completed / migration.tables_total) * 100}%`,
                                    backgroundColor: STATUS_COLORS[migration.status]?.text || "#22c55e",
                                  }}
                                />
                                <span className="progress-text">
                                  {migration.tables_completed} / {migration.tables_total}
                                </span>
                              </S.ProgressBar>
                            )}
                          </td>
                          <td>{migration.rows_migrated.toLocaleString()}</td>
                          <td>{formatDateTime(migration.created_at)}</td>
                          <td>
                            <S.ActionButtons>
                              {migration.status === "pending" && (
                                <S.SmallButton onClick={(e) => { e.stopPropagation(); handleStartMigration(migration.id); }}>
                                  Start
                                </S.SmallButton>
                              )}
                              {migration.status === "failed" && (
                                <S.SmallButton $variant="ghost" onClick={(e) => { e.stopPropagation(); handleRetryMigration(migration.id); }}>
                                  Retry
                                </S.SmallButton>
                              )}
                              {(migration.status === "running" || migration.status === "pending") && (
                                <S.SmallButton $variant="danger" onClick={(e) => { e.stopPropagation(); handleCancelMigration(migration.id); }}>
                                  Cancel
                                </S.SmallButton>
                              )}
                              <S.SmallButton $variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewDetails(migration); }}>
                                Details
                              </S.SmallButton>
                            </S.ActionButtons>
                          </td>
                        </tr>
                      )
                    })}
                    </tbody>
                    </S.MigrationTable>
                  </S.MigrationTableWrapper>
                )}
              </S.CardContent>
            </S.Card>
          </>
        )}

        {selectedMigration && (
          <S.ModalOverlay onClick={() => setSelectedMigration(null)}>
            <S.Modal onClick={(e) => e.stopPropagation()}>
              <S.ModalHeader>
                <S.ModalTitle>Migration Details</S.ModalTitle>
                <S.CloseButton onClick={() => setSelectedMigration(null)}>×</S.CloseButton>
              </S.ModalHeader>
              <S.ModalContent>
                <S.DetailRow>
                  <S.DetailLabel>Migration ID</S.DetailLabel>
                  <S.DetailValue>{selectedMigration.id}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Source</S.DetailLabel>
                  <S.DetailValue>{getSourceLabel(selectedMigration)} ({selectedMigration.source_db_type})</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Target</S.DetailLabel>
                  <S.DetailValue>{getTargetLabel(selectedMigration)} ({selectedMigration.target_db_type})</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Status</S.DetailLabel>
                  <S.DetailValue>
                    <S.StatusBadge $bg={STATUS_COLORS[selectedMigration.status].bg} $text={STATUS_COLORS[selectedMigration.status].text} $border={STATUS_COLORS[selectedMigration.status].border}>
                      {selectedMigration.status.charAt(0).toUpperCase() + selectedMigration.status.slice(1)}
                    </S.StatusBadge>
                  </S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Tables</S.DetailLabel>
                  <S.DetailValue>{selectedMigration.tables_completed} / {selectedMigration.tables_total}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Rows Migrated</S.DetailLabel>
                  <S.DetailValue>{selectedMigration.rows_migrated.toLocaleString()}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Created</S.DetailLabel>
                  <S.DetailValue>{formatDateTime(selectedMigration.created_at)}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Started</S.DetailLabel>
                  <S.DetailValue>{formatDateTime(selectedMigration.started_at)}</S.DetailValue>
                </S.DetailRow>
                <S.DetailRow>
                  <S.DetailLabel>Completed</S.DetailLabel>
                  <S.DetailValue>{formatDateTime(selectedMigration.completed_at)}</S.DetailValue>
                </S.DetailRow>
                {selectedMigration.error_message && (
                  <S.DetailRow>
                    <S.DetailLabel>Error</S.DetailLabel>
                    <S.DetailValue style={{ color: "#f87171" }}>{selectedMigration.error_message}</S.DetailValue>
                  </S.DetailRow>
                )}
              </S.ModalContent>
            </S.Modal>
          </S.ModalOverlay>
        )}
      </S.Content>
    </S.Container>
  );
}