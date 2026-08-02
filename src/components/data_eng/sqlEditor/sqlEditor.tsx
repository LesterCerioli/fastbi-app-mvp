"use client";

import { useState, FormEvent } from "react";
import * as S from "./styles";
import SchemaPreview from "./schemaPreview";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface QueryResult {
  success: boolean;
  row_count?: number;
  columns?: string[];
  data?: Record<string, unknown>[];
  query_executed?: string;
  error?: string;
}

interface SqlEditorProps {
  connectionId: string;
  connectionName?: string;
  organizationName?: string;
  onBack?: () => void;
}

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

export default function SqlEditor({
  connectionId,
  connectionName,
  organizationName = "",
  onBack,
}: SqlEditorProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { t } = useTranslations();

  const handleRun = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setResult(null);

    try {
      const token = await getFreshToken();
      const res = await fetch("/api/dataeng/clientconn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "query",
          organization_name: organizationName,
          connection_id: connectionId,
          query,
          params: [],
        }),
      });

      const data: QueryResult = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || t("dataeng.sqlEditor.runFailed"),
        });
        return;
      }

      if (!data.success) {
        setMessage({
          type: "error",
          text: data.error || t("dataeng.sqlEditor.queryFailed"),
        });
        return;
      }

      setResult(data);
      setMessage({ type: "success", text: t("dataeng.sqlEditor.success") });
    } catch {
      setMessage({ type: "error", text: t("dataeng.sqlEditor.serverError") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <S.Wrapper>
      <S.Header>
        <S.HeaderInfo>
          <S.Title>{t("dataeng.sqlEditor.title")}</S.Title>
          <S.Subtitle>{t("dataeng.sqlEditor.subtitle")}</S.Subtitle>
        </S.HeaderInfo>
        {onBack && (
          <S.BackButton type="button" onClick={onBack}>
            {"\u2190"} {t("dataeng.sqlEditor.back")}
          </S.BackButton>
        )}
      </S.Header>

      <S.SplitLayout>
        <S.EditorCard onSubmit={handleRun} as="form">
          {connectionName && <S.ConnectionTag>{connectionName}</S.ConnectionTag>}

          <S.Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dataeng.sqlEditor.placeholder")}
            spellCheck={false}
            disabled={isLoading}
          />

          <S.Toolbar>
            <S.RunButton type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <>
                  <S.Spinner /> {t("dataeng.sqlEditor.running")}
                </>
              ) : (
                t("dataeng.sqlEditor.run")
              )}
            </S.RunButton>
          </S.Toolbar>

          {message && (
            <S.ErrorBox>
              {message.type === "success" ? "\u2713" : "\u2717"} {message.text}
            </S.ErrorBox>
          )}

          {result && result.success && (
            <>
              <S.ResultMeta>
                <span>
                  {t(
                    result.row_count === 1
                      ? "dataeng.sqlEditor.rowsOne"
                      : "dataeng.sqlEditor.rowsMany",
                    { count: result.row_count ?? 0 }
                  )}
                </span>
                {result.query_executed && (
                  <span>
                    {t("dataeng.sqlEditor.queryLabel", {
                      query: result.query_executed,
                    })}
                  </span>
                )}
              </S.ResultMeta>

              {result.columns && result.columns.length > 0 ? (
                <S.TableWrapper>
                  <S.Table>
                    <S.THead>
                      <tr>
                        {result.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </S.THead>
                    <S.TBody>
                      {(result.data || []).map((row, i) => (
                        <tr key={i}>
                          {result.columns!.map((col) => (
                            <td key={col}>
                              {row[col] !== null && row[col] !== undefined
                                ? String(row[col])
                                : "NULL"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </S.TBody>
                  </S.Table>
                </S.TableWrapper>
              ) : (
                <S.EmptyResult>{t("dataeng.sqlEditor.noColumns")}</S.EmptyResult>
              )}
            </>
          )}
        </S.EditorCard>

        <S.SchemaPanel>
          <SchemaPreview connectionId={connectionId} />
        </S.SchemaPanel>
      </S.SplitLayout>
    </S.Wrapper>
  );
}
