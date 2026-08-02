"use client";

import { useState, FormEvent } from "react";
import * as S from "./styles";

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
        setMessage({ type: "error", text: data.error || "Failed to run query" });
        return;
      }

      if (!data.success) {
        setMessage({ type: "error", text: data.error || "Query failed" });
        return;
      }

      setResult(data);
      setMessage({ type: "success", text: "Query executed successfully" });
    } catch {
      setMessage({ type: "error", text: "Unable to reach the server" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <S.Wrapper>
      <S.Header>
        <S.HeaderInfo>
          <S.Title>SQL Editor</S.Title>
          <S.Subtitle>
            Run SELECT queries against your connection
          </S.Subtitle>
        </S.HeaderInfo>
        {onBack && (
          <S.BackButton type="button" onClick={onBack}>
            {"\u2190"} Back to connections
          </S.BackButton>
        )}
      </S.Header>

      <S.EditorCard onSubmit={handleRun} as="form">
        {connectionName && <S.ConnectionTag>{connectionName}</S.ConnectionTag>}

        <S.Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM your_table LIMIT 100;"
          spellCheck={false}
          disabled={isLoading}
        />

        <S.Toolbar>
          <S.RunButton type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <>
                <S.Spinner /> Running
              </>
            ) : (
              "Run Query"
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
                {result.row_count} row{result.row_count === 1 ? "" : "s"}
              </span>
              {result.query_executed && (
                <span>query: {result.query_executed}</span>
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
              <S.EmptyResult>Query returned no columns</S.EmptyResult>
            )}
          </>
        )}
      </S.EditorCard>
    </S.Wrapper>
  );
}
