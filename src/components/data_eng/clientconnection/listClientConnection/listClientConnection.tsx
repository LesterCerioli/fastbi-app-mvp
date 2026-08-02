"use client";

import { useState, useEffect, useCallback } from "react";
import * as S from "./styles";
import { prefetchSchema } from "../../sqlEditor/schemaPreview";
import { useTranslations } from "@/lib/i18n/useTranslations";

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
  refreshKey?: number;
  onDelete?: () => void;
  onSelect?: (connectionId: string, connectionName: string) => void;
}

const DB_LABELS: Record<string, string> = {
  postgresql: "PG",
  mysql: "MY",
  mariadb: "MR",
  mssql: "MS",
  oracle: "OR",
  sqlite: "SQ",
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

function formatDate(
  dateStr: string | null,
  t: ReturnType<typeof useTranslations>["t"]
): string {
  if (!dateStr) return t("dataeng.connections.never");
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("dataeng.connections.justNow");
  if (diffMins < 60)
    return t("dataeng.connections.minutesAgo", { count: diffMins });
  if (diffHours < 24)
    return t("dataeng.connections.hoursAgo", { count: diffHours });
  if (diffDays < 7)
    return t("dataeng.connections.daysAgo", { count: diffDays });
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function ListClientConnection({
  organizationName,
  refreshKey = 0,
  onDelete,
  onSelect,
}: ListClientConnectionProps) {
  const [orgName, setOrgName] = useState(organizationName || "");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const { t } = useTranslations();

  const effectiveOrgName = organizationName || orgName;

  const fetchConnections = useCallback(async () => {
    const name = organizationName || orgName;
    if (!name) return;
    setIsLoading(true);
    setError(null);
    setHasFetched(true);

    try {
      const token = await getFreshToken();
      const params = new URLSearchParams({
        organization_name: name,
      });

      const res = await fetch(`/api/dataeng/clientconn?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("dataeng.connections.loadError"));
        return;
      }

      setConnections(Array.isArray(data) ? data : []);
    } catch {
      setError(t("dataeng.connections.serverError"));
    } finally {
      setIsLoading(false);
    }
  }, [organizationName, orgName, t]);

  useEffect(() => {
    if (effectiveOrgName) {
      fetchConnections();
    }
  }, [fetchConnections, refreshKey, effectiveOrgName]);

  const handleDelete = async (connectionId: string) => {
    setDeletingId(connectionId);
    setError(null);

    try {
      const token = await getFreshToken();
      const params = new URLSearchParams({
        connection_id: connectionId,
      });

      const res = await fetch(`/api/dataeng/clientconn?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("dataeng.connections.deleteError"));
        return;
      }

      setConnections((prev) =>
        prev.filter((c) => c.id !== connectionId)
      );
      onDelete?.();
    } catch {
      setError(t("dataeng.connections.serverError"));
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
        <S.Title>{t("dataeng.connections.title")}</S.Title>
        {effectiveOrgName && (
          <S.ConnectionsCount>
            {t(
              connections.length === 1
                ? "dataeng.connections.countOne"
                : "dataeng.connections.countMany",
              { count: connections.length }
            )}
          </S.ConnectionsCount>
        )}
      </S.Header>

      {!effectiveOrgName && (
        <S.Empty>
          <S.EmptyIcon>&#128225;</S.EmptyIcon>
          <S.EmptyText>
            {t("dataeng.connections.noOrg")}
          </S.EmptyText>
          <S.OrgInputInline
            type="text"
            placeholder={t("dataeng.connections.orgPlaceholder")}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </S.Empty>
      )}

      {error && (
        <S.ErrorMessage>
          {error}
          <S.RetryButton onClick={fetchConnections}>
            {t("dataeng.connections.retry")}
          </S.RetryButton>
        </S.ErrorMessage>
      )}

      {!error && effectiveOrgName && !hasFetched && (
        <S.LoadingWrapper>
          <S.Spinner />
          <S.LoadingText>{t("dataeng.connections.loading")}</S.LoadingText>
        </S.LoadingWrapper>
      )}

      {!error && effectiveOrgName && hasFetched && connections.length === 0 && (
        <S.Empty>
          <S.EmptyIcon>&#128225;</S.EmptyIcon>
          <S.EmptyText>
            {t("dataeng.connections.empty")}
          </S.EmptyText>
        </S.Empty>
      )}

      {connections.length > 0 && (
        <S.Grid>
          {connections.map((conn, index) => (
            <S.Card
              key={conn.id}
              $index={index}
              $clickable={Boolean(onSelect)}
              onClick={() => onSelect?.(conn.id, conn.connection_name)}
              onMouseEnter={() => prefetchSchema(conn.id)}
            >
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
                      {t("dataeng.connections.created", {
                        date: formatDate(conn.created_at, t),
                      })}
                    </S.MetaTag>
                  </S.ConnectionMeta>
                </S.CardInfo>
              </S.CardLeft>
              <S.CardRight>
                <S.StatusBadge $active={conn.is_active}>
                  {t(
                    conn.is_active
                      ? "dataeng.connections.active"
                      : "dataeng.connections.inactive"
                  )}
                </S.StatusBadge>
                <S.Actions>
                  <S.IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conn.id);
                    }}
                    disabled={deletingId === conn.id}
                    title={t("dataeng.connections.deleteTitle")}
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
