"use client";

import { useState, useEffect, useCallback } from "react";
import * as S from "./styles";

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

interface ListClientConnectionProps {
  organizationName?: string;
  token?: string;
  refreshKey?: number;
  onDelete?: () => void;
}

const DB_LABELS: Record<string, string> = {
  postgresql: "PG",
  mysql: "MY",
  mariadb: "MR",
  mssql: "MS",
  oracle: "OR",
  sqlite: "SQ",
};

function getToken() {
  try {
    return localStorage.getItem("auth_token") || "";
  } catch {
    return "";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function ListClientConnection({
  organizationName,
  token,
  refreshKey = 0,
  onDelete,
}: ListClientConnectionProps) {
  const [orgName, setOrgName] = useState(organizationName || "");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const authToken = token || getToken();

  const effectiveOrgName = organizationName || orgName;

  const fetchConnections = useCallback(async () => {
    const name = organizationName || orgName;
    if (!name) return;
    setIsLoading(true);
    setError(null);
    setHasFetched(true);

    try {
      const params = new URLSearchParams({
        organization_name: name,
        token: authToken,
      });

      const res = await fetch(`/api/dataeng/clientconn?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load connections");
        return;
      }

      setConnections(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to reach the server");
    } finally {
      setIsLoading(false);
    }
  }, [organizationName, orgName, authToken]);

  useEffect(() => {
    if (effectiveOrgName) {
      fetchConnections();
    }
  }, [fetchConnections, refreshKey, effectiveOrgName]);

  const handleDelete = async (connectionId: string) => {
    setDeletingId(connectionId);
    setError(null);

    try {
      const params = new URLSearchParams({
        connection_id: connectionId,
        token: authToken,
      });

      const res = await fetch(`/api/dataeng/clientconn?${params}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete connection");
        return;
      }

      setConnections((prev) =>
        prev.filter((c) => c.id !== connectionId)
      );
      onDelete?.();
    } catch {
      setError("Unable to delete connection");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <S.Wrapper>
        <S.SkeletonCard>
          <S.SkeletonIcon />
          <S.SkeletonLines>
            <S.SkeletonLine $width="160px" />
            <S.SkeletonLine $width="240px" />
          </S.SkeletonLines>
        </S.SkeletonCard>
        <S.SkeletonCard>
          <S.SkeletonIcon />
          <S.SkeletonLines>
            <S.SkeletonLine $width="160px" />
            <S.SkeletonLine $width="240px" />
          </S.SkeletonLines>
        </S.SkeletonCard>
        <S.SkeletonCard>
          <S.SkeletonIcon />
          <S.SkeletonLines>
            <S.SkeletonLine $width="160px" />
            <S.SkeletonLine $width="240px" />
          </S.SkeletonLines>
        </S.SkeletonCard>
      </S.Wrapper>
    );
  }

  return (
    <S.Wrapper>
      <S.Header>
        <S.Title>Connections</S.Title>
        {effectiveOrgName && (
          <S.ConnectionsCount>
            {connections.length}{" "}
            {connections.length === 1 ? "connection" : "connections"}
          </S.ConnectionsCount>
        )}
      </S.Header>

      {!effectiveOrgName && (
        <S.Empty>
          <S.EmptyIcon>&#128225;</S.EmptyIcon>
          <S.EmptyText>
            Enter an organization name to view its connections
          </S.EmptyText>
          <S.OrgInputInline
            type="text"
            placeholder="e.g. my-org"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </S.Empty>
      )}

      {error && (
        <S.ErrorMessage>
          {error}
          <S.RetryButton onClick={fetchConnections}>Retry</S.RetryButton>
        </S.ErrorMessage>
      )}

      {!error && effectiveOrgName && !hasFetched && (
        <S.LoadingWrapper>
          <S.Spinner />
          <S.LoadingText>Loading connections...</S.LoadingText>
        </S.LoadingWrapper>
      )}

      {!error && effectiveOrgName && hasFetched && connections.length === 0 && (
        <S.Empty>
          <S.EmptyIcon>&#128225;</S.EmptyIcon>
          <S.EmptyText>
            No connections found for this organization
          </S.EmptyText>
        </S.Empty>
      )}

      {connections.length > 0 && (
        <S.Grid>
          {connections.map((conn, index) => (
            <S.Card key={conn.id} $index={index}>
              <S.CardLeft>
                <S.DbIcon $type={conn.db_type}>
                  {DB_LABELS[conn.db_type] || "DB"}
                </S.DbIcon>
                <S.CardInfo>
                  <S.ConnectionName>{conn.connection_name}</S.ConnectionName>
                  <S.ConnectionMeta>
                    <S.MetaTag $noDot>{conn.db_type}</S.MetaTag>
                    <S.MetaTag>
                      {conn.host}:{conn.port}
                    </S.MetaTag>
                    <S.MetaTag>{conn.database_name}</S.MetaTag>
                    <S.MetaTag>
                      Created {formatDate(conn.created_at)}
                    </S.MetaTag>
                  </S.ConnectionMeta>
                </S.CardInfo>
              </S.CardLeft>
              <S.CardRight>
                <S.StatusBadge $active={conn.is_active}>
                  {conn.is_active ? "Active" : "Inactive"}
                </S.StatusBadge>
                <S.Actions>
                  <S.IconButton
                    onClick={() => handleDelete(conn.id)}
                    disabled={deletingId === conn.id}
                    title="Delete connection"
                  >
                    {deletingId === conn.id ? "\u23F3" : "\u2716"}
                  </S.IconButton>
                </S.Actions>
              </S.CardRight>
            </S.Card>
          ))}
        </S.Grid>
      )}
    </S.Wrapper>
  );
}
