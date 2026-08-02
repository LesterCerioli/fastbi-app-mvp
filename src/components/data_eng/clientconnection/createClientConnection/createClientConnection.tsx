"use client";

import { useState, FormEvent } from "react";
import * as S from "./styles";

interface CreateClientConnectionProps {
  organizationName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DB_TYPES = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "mssql", label: "SQL Server" },
  { value: "oracle", label: "Oracle" },
  { value: "sqlite", label: "SQLite" },
];

const SSL_MODES = [
  { value: "require", label: "Require" },
  { value: "prefer", label: "Prefer" },
  { value: "allow", label: "Allow" },
  { value: "disable", label: "Disable" },
  { value: "verify-ca", label: "Verify CA" },
  { value: "verify-full", label: "Verify Full" },
];

export default function CreateClientConnection({
  organizationName = "",
  onSuccess,
  onCancel,
}: CreateClientConnectionProps) {
  const [form, setForm] = useState({
    organization_name: organizationName,
    connection_name: "",
    host: "",
    port: "5432",
    database_name: "",
    username: "",
    password: "",
    db_type: "postgresql",
    ssl_mode: "require",
    max_rows_limit: "10000",
    query_timeout_seconds: "30",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const getToken = async () => {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) throw new Error("Failed to obtain auth token");
    const data = await res.json();
    return data.token;
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/dataeng/clientconn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "test",
          connection_id: "",
          organization_name: form.organization_name,
          host: form.host,
          port: Number(form.port),
          database_name: form.database_name,
          username: form.username,
          password: form.password,
          db_type: form.db_type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Connection test failed" });
        return;
      }

      setMessage({ type: "success", text: "Connection successful!" });
    } catch {
      setMessage({ type: "error", text: "Unable to reach the server" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/dataeng/clientconn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: form.organization_name,
          connection_name: form.connection_name,
          host: form.host,
          port: Number(form.port),
          database_name: form.database_name,
          username: form.username,
          password: form.password,
          db_type: form.db_type,
          ssl_mode: form.ssl_mode,
          max_rows_limit: Number(form.max_rows_limit),
          query_timeout_seconds: Number(form.query_timeout_seconds),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to create connection" });
        return;
      }

      setMessage({ type: "success", text: "Connection created successfully!" });
      onSuccess?.();
    } catch {
      setMessage({ type: "error", text: "Unable to reach the server" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <S.Wrapper>
      <S.Card onSubmit={handleSubmit}>
        <S.Header>
          <S.Title>New Connection</S.Title>
          <S.Subtitle>
            Configure a new database connection for your organization
          </S.Subtitle>
        </S.Header>

        {message && (
          <S.Message $type={message.type}>
            {message.type === "success" ? "\u2713" : "\u2717"} {message.text}
          </S.Message>
        )}

        <S.SectionTitle>Organization</S.SectionTitle>

        <S.Field>
          <S.Label htmlFor="organization_name">
            Organization Name <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            id="organization_name"
            type="text"
            placeholder="e.g. my-org"
            value={form.organization_name}
            onChange={(e) => updateField("organization_name", e.target.value)}
            required
          />
        </S.Field>

        <S.Divider />

        <S.SectionTitle>Connection Details</S.SectionTitle>

        <S.Field>
          <S.Label htmlFor="connection_name">
            Connection Name <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            id="connection_name"
            type="text"
            placeholder="e.g. Production Database"
            value={form.connection_name}
            onChange={(e) => updateField("connection_name", e.target.value)}
            required
          />
        </S.Field>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="db_type">
              Database Type <S.Required>*</S.Required>
            </S.Label>
            <S.Select
              id="db_type"
              value={form.db_type}
              onChange={(e) => updateField("db_type", e.target.value)}
              required
            >
              {DB_TYPES.map((db) => (
                <option key={db.value} value={db.value}>
                  {db.label}
                </option>
              ))}
            </S.Select>
          </S.Field>

          <S.Field>
            <S.Label htmlFor="ssl_mode">SSL Mode</S.Label>
            <S.Select
              id="ssl_mode"
              value={form.ssl_mode}
              onChange={(e) => updateField("ssl_mode", e.target.value)}
            >
              {SSL_MODES.map((ssl) => (
                <option key={ssl.value} value={ssl.value}>
                  {ssl.label}
                </option>
              ))}
            </S.Select>
          </S.Field>
        </S.Row>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="host">
              Host <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              id="host"
              type="text"
              placeholder="e.g. localhost or db.example.com"
              value={form.host}
              onChange={(e) => updateField("host", e.target.value)}
              required
            />
          </S.Field>

          <S.Field>
            <S.Label htmlFor="port">
              Port <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              id="port"
              type="number"
              placeholder="5432"
              value={form.port}
              onChange={(e) => updateField("port", e.target.value)}
              required
              min={1}
              max={65535}
            />
          </S.Field>
        </S.Row>

        <S.Field>
          <S.Label htmlFor="database_name">
            Database Name <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            id="database_name"
            type="text"
            placeholder="e.g. my_database"
            value={form.database_name}
            onChange={(e) => updateField("database_name", e.target.value)}
            required
          />
        </S.Field>

        <S.Divider />

        <S.SectionTitle>Authentication</S.SectionTitle>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="username">
              Username <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              id="username"
              type="text"
              placeholder="Database user"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              required
            />
          </S.Field>

          <S.Field>
            <S.Label htmlFor="password">
              Password <S.Required>*</S.Required>
            </S.Label>
            <S.Input
              id="password"
              type="password"
              placeholder="Database password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
            />
          </S.Field>
        </S.Row>

        <S.Divider />

        <S.SectionTitle>Limits</S.SectionTitle>

        <S.Row>
          <S.Field>
            <S.Label htmlFor="max_rows_limit">Max Rows Limit</S.Label>
            <S.Input
              id="max_rows_limit"
              type="number"
              placeholder="10000"
              value={form.max_rows_limit}
              onChange={(e) => updateField("max_rows_limit", e.target.value)}
              min={1}
            />
            <S.Hint>Maximum number of rows returned per query</S.Hint>
          </S.Field>

          <S.Field>
            <S.Label htmlFor="query_timeout_seconds">
              Query Timeout (seconds)
            </S.Label>
            <S.Input
              id="query_timeout_seconds"
              type="number"
              placeholder="30"
              value={form.query_timeout_seconds}
              onChange={(e) =>
                updateField("query_timeout_seconds", e.target.value)
              }
              min={1}
            />
            <S.Hint>Maximum execution time per query</S.Hint>
          </S.Field>
        </S.Row>

        <S.Divider />

        <S.Actions>
          {onCancel && (
            <S.Button
              type="button"
              $variant="ghost"
              onClick={onCancel}
              disabled={isLoading || isTesting}
            >
              Cancel
            </S.Button>
          )}
          <S.Button
            type="button"
            $variant="secondary"
            onClick={handleTestConnection}
            disabled={isLoading || isTesting}
          >
            {isTesting ? (
              <>
                <S.Spinner /> Testing
              </>
            ) : (
              "Test Connection"
            )}
          </S.Button>
          <S.Button
            type="submit"
            $variant="primary"
            disabled={isLoading || isTesting}
          >
            {isLoading ? (
              <>
                <S.Spinner /> Creating
              </>
            ) : (
              "Create Connection"
            )}
          </S.Button>
        </S.Actions>
      </S.Card>
    </S.Wrapper>
  );
}
