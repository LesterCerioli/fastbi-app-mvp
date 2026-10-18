"use client";

import { useState, useEffect } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

const RESTORE_API = "/api/buckets/manage/restore";

export interface DeletedBucket {
  id: string;
  name: string;
  description?: string | null;
  s3_bucket_name?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface RestoredBucketsProps {
  organizationName?: string;
  /** Chave para forçar recarregar quando o pai quiser */
  refreshKey?: number;
  /** Callback chamado quando um bucket é restaurado com sucesso */
  onRestored?: () => void;
}

interface State {
  buckets: DeletedBucket[];
  loading: boolean;
  error: string | null;
}

type Status = { variant: "success" | "error"; message: string } | null;

async function fetchAuthToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Falha ao obter token");
  }
  return data.token as string;
}

function getOrganizationNameFromStorage(): string {
  if (typeof window === "undefined") return "";
  return (sessionStorage.getItem("organization_name") || "").trim();
}


function interpolate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    values[key] !== undefined ? values[key] : `{${key}}`
  );
}

export default function RestoredBuckets({
  organizationName,
  refreshKey,
  onRestored,
}: RestoredBucketsProps) {
  const { t } = useTranslations();
  const [state, setState] = useState<State>({
    buckets: [],
    loading: true,
    error: null,
  });
  const [restoringName, setRestoringName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const orgName = (organizationName || getOrganizationNameFromStorage()).trim();

  useEffect(() => {
    fetchDeleted();
    
  }, [orgName, refreshKey]);

  const fetchDeleted = async () => {
    if (!orgName) {
      setState({ buckets: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const token = await fetchAuthToken();
      const res = await fetch(
        `${RESTORE_API}?organization_name=${encodeURIComponent(orgName)}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(t("buckets.restore.loadError"));
      }

      const data = await res.json();
      setState({ buckets: data.buckets || [], loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        buckets: prev.buckets,
        loading: false,
        error:
          err instanceof Error ? err.message : t("buckets.restore.loadError"),
      }));
    }
  };

  const handleRestore = async (bucket: DeletedBucket) => {
    setStatus(null);
    setRestoringName(bucket.name);

    try {
      const token = await fetchAuthToken();
      const res = await fetch(RESTORE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: orgName,
          name: bucket.name,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          variant: "error",
          message: interpolate(t("buckets.restore.error"), {
            error: data.error || "Unknown error",
          }),
        });
        return;
      }

      
      setState((prev) => ({
        ...prev,
        buckets: prev.buckets.filter((b) => b.id !== bucket.id),
      }));

      setStatus({
        variant: "success",
        message: interpolate(t("buckets.restore.success"), {
          name: bucket.name,
        }),
      });

      
      onRestored?.();
    } catch (err) {
      setStatus({
        variant: "error",
        message: interpolate(t("buckets.restore.error"), {
          error: err instanceof Error ? err.message : "Unknown error",
        }),
      });
    } finally {
      setRestoringName(null);
    }
  };

  const renderCard = (bucket: DeletedBucket) => {
    const isRestoring = restoringName === bucket.name;

    return (
      <S.RestoredCard key={bucket.id}>
        <S.RestoredHeader>
          <S.RestoredIcon>
            {(bucket.name || "?").charAt(0).toUpperCase()}
          </S.RestoredIcon>
          <S.RestoredInfo>
            <S.RestoredName>{bucket.name}</S.RestoredName>
            <S.RestoredDesc>
              {bucket.description || t("buckets.restore.noDescription")}
            </S.RestoredDesc>
            {bucket.deleted_at && (
              <S.RestoredDate>
                {interpolate(t("buckets.restore.deletedAt"), {
                  date: new Date(bucket.deleted_at).toLocaleString(),
                })}
              </S.RestoredDate>
            )}
          </S.RestoredInfo>
          <S.RestoreButton
            type="button"
            onClick={() => handleRestore(bucket)}
            disabled={isRestoring}
          >
            {isRestoring
              ? t("buckets.restore.restoring")
              : t("buckets.restore.button")}
          </S.RestoreButton>
        </S.RestoredHeader>
      </S.RestoredCard>
    );
  };

  if (state.loading) {
    return (
      <S.Wrapper>
        <S.SectionTitle>{t("buckets.restore.title")}</S.SectionTitle>
        <S.Loading>{t("buckets.restore.loading")}</S.Loading>
      </S.Wrapper>
    );
  }

  if (state.error) {
    return (
      <S.Wrapper>
        <S.SectionTitle>{t("buckets.restore.title")}</S.SectionTitle>
        <S.Loading>
          {state.error}{" "}
          <button
            onClick={fetchDeleted}
            style={{ marginLeft: 8, color: "#34d399" }}
          >
            {t("buckets.restore.retry")}
          </button>
        </S.Loading>
      </S.Wrapper>
    );
  }

  
  if (state.buckets.length === 0) {
    return null;
  }

  return (
    <S.Wrapper>
      <S.SectionTitle>{t("buckets.restore.title")}</S.SectionTitle>
      <S.SectionSubtitle>{t("buckets.restore.subtitle")}</S.SectionSubtitle>

      {status && (
        <S.StatusBanner $variant={status.variant}>
          {status.message}
        </S.StatusBanner>
      )}

      {state.buckets.map((bucket) => renderCard(bucket))}
    </S.Wrapper>
  );
}