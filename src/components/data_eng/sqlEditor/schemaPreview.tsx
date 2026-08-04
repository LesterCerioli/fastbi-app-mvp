"use client";

import { useState, useEffect, useCallback } from "react";
import * as S from "./schemaPreviewStyles";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface SchemaColumn {
  name: string;
  data_type: string;
  max_length: number | null;
  nullable: boolean;
  default: string | null;
  is_primary_key: boolean;
}

interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

interface SchemaResponse {
  success: boolean;
  tables: SchemaTable[];
  error?: string;
}

interface SchemaPreviewProps {
  connectionId: string;
}

const TOKEN_TTL_MS = 5 * 60 * 1000;
const SCHEMA_TTL_MS = 5 * 60 * 1000;
const SCHEMA_TIMEOUT_MS = 8000;
const SCHEMA_LOAD_FAILED = "Failed to load schema";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getFreshToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error("Failed to obtain auth token");
  const data = await res.json();
  tokenCache = { token: data.token, expiresAt: now + TOKEN_TTL_MS };
  return data.token;
}

const schemaCache = new Map<
  string,
  { tables: SchemaTable[]; expiresAt: number }
>();

const inFlight = new Map<string, Promise<SchemaTable[]>>();

async function loadSchema(connectionId: string): Promise<SchemaTable[]> {
  const now = Date.now();
  const cached = schemaCache.get(connectionId);
  if (cached && cached.expiresAt > now) {
    return cached.tables;
  }

  const existing = inFlight.get(connectionId);
  if (existing) return existing;

  const promise = (async () => {
    const token = await getFreshToken();
    const params = new URLSearchParams({
      action: "schema",
      connection_id: connectionId,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCHEMA_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/dataeng/clientconn?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const data: SchemaResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || SCHEMA_LOAD_FAILED);
      }
      const tables = Array.isArray(data.tables) ? data.tables : [];
      schemaCache.set(connectionId, {
        tables,
        expiresAt: Date.now() + SCHEMA_TTL_MS,
      });
      return tables;
    } finally {
      clearTimeout(timer);
    }
  })();

  inFlight.set(connectionId, promise);
  promise
    .then(() => inFlight.delete(connectionId))
    .catch(() => inFlight.delete(connectionId));
  return promise;
}

export function prefetchSchema(connectionId: string): void {
  loadSchema(connectionId).catch(() => undefined);
}

const TYPE_SHORT_NAMES: Record<string, string> = {
  "character varying": "varchar",
  character: "char",
  "timestamp without time zone": "timestamp",
  "timestamp with time zone": "timestamptz",
  "time without time zone": "time",
  "time with time zone": "timetz",
  "double precision": "float8",
  "real": "float4",
  integer: "int",
  bigint: "int8",
  smallint: "int2",
  boolean: "bool",
};

function shortType(dataType: string, maxLength: number | null): string {
  const lower = dataType.toLowerCase();
  const short = TYPE_SHORT_NAMES[lower] || lower;
  return maxLength !== null ? `${short}(${maxLength})` : short;
}

export default function SchemaPreview({ connectionId }: SchemaPreviewProps) {
  const { t } = useTranslations();
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTables, setOpenTables] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredTables =
    normalizedFilter.length === 0
      ? tables
      : tables.filter(
          (t) =>
            t.name.toLowerCase().includes(normalizedFilter) ||
            t.columns.some((c) =>
              c.name.toLowerCase().includes(normalizedFilter)
            )
        );

  const fetchSchema = useCallback(async () => {
    const now = Date.now();
    const cached = schemaCache.get(connectionId);
    if (cached && cached.expiresAt > now) {
      setTables(cached.tables);
      setOpenTables(new Set(cached.tables.map((t) => t.name)));
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const tables = await loadSchema(connectionId);
      setTables(tables);
      setOpenTables(new Set(tables.map((t) => t.name)));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.name === "AbortError"
            ? t("dataeng.schemaPreview.timedOut")
            : err.message === SCHEMA_LOAD_FAILED
              ? t("dataeng.schemaPreview.failedToLoad")
              : err.message
          : t("dataeng.schemaPreview.serverError")
      );
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  }, [connectionId, t]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const toggleTable = (name: string) => {
    setOpenTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <S.Wrapper>
      <S.HeaderRow>
        <S.Title>{t("dataeng.schemaPreview.tables")}</S.Title>
        <S.CountBadge>
          {t(
            tables.length === 1
              ? "dataeng.schemaPreview.tablesOne"
              : "dataeng.schemaPreview.tablesMany",
            { count: tables.length }
          )}
        </S.CountBadge>
      </S.HeaderRow>

      {!isLoading && !error && tables.length > 0 && (
        <S.SearchInput
          type="text"
          aria-label={t("dataeng.schemaPreview.filterPlaceholder")}
          placeholder={t("dataeng.schemaPreview.filterPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          spellCheck={false}
        />
      )}

      <div aria-live="polite" aria-busy={isLoading}>
      {isLoading && (
        <S.LoadingBox>
          <S.Spinner /> {t("dataeng.schemaPreview.loading")}
        </S.LoadingBox>
      )}

      {!isLoading && error && (
        <S.ErrorBox>
          {error}
          <S.RetryButton type="button" onClick={fetchSchema}>
            {t("dataeng.schemaPreview.retry")}
          </S.RetryButton>
        </S.ErrorBox>
      )}

      {!isLoading && !error && tables.length === 0 && (
        <S.EmptyBox>{t("dataeng.schemaPreview.noTables")}</S.EmptyBox>
      )}

      {!isLoading && !error && tables.length > 0 && (
        <S.FlatList>
          {filteredTables.map((table) => {
            const isOpen =
              normalizedFilter.length > 0 || openTables.has(table.name);
            return (
              <div key={table.name}>
                <S.TableLine onClick={() => toggleTable(table.name)}>
                  <S.TableName translate="no">{table.name}</S.TableName>
                </S.TableLine>
                {isOpen &&
                  table.columns.map((col) => (
                    <S.ColLine
                      key={col.name}
                      title={col.default !== null ? `default: ${col.default}` : undefined}
                    >
                      <S.KeyMark>{col.is_primary_key ? "PK" : ""}</S.KeyMark>
                      <S.ColName translate="no">{col.name}</S.ColName>
                      <S.ColType translate="no">
                        {shortType(col.data_type, col.max_length)}
                        {col.nullable ? " null" : ""}
                      </S.ColType>
                    </S.ColLine>
                  ))}
              </div>
            );
          })}
          {filteredTables.length === 0 && (
            <S.EmptyBox>
              {t("dataeng.schemaPreview.noMatch", { filter })}
            </S.EmptyBox>
          )}
        </S.FlatList>
      )}
      </div>
    </S.Wrapper>
  );
}
