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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (!res.ok) throw new Error("Failed to fetch deleted buckets");

      const data = await res.json();
      setState({ buckets: data.buckets || [], loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        buckets: prev.buckets,
        loading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
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
          message: `Failed to restore: ${data.error || "Unknown error"}`,
        });
        return;
      }

      // Remove da lista local de deletados
      setState((prev) => ({
        ...prev,
        buckets: prev.buckets.filter((b) => b.id !== bucket.id),
      }));

      setStatus({
        variant: "success",
        message: `Bucket restored: ${bucket.name}`,
      });

      // Avisa o pai (para recarregar a lista principal de buckets)
      onRestored?.();
    } catch (err) {
      setStatus({
        variant: "error",
        message: `Failed to restore: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
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
              {bucket.description || "No description"}
            </S.RestoredDesc>
            {bucket.deleted_at && (
              <S.RestoredDate>
                Deleted at: {new Date(bucket.deleted_at).toLocaleString()}
              </S.RestoredDate>
            )}
          </S.RestoredInfo>
          <S.RestoreButton
            type="button"
            onClick={() => handleRestore(bucket)}
            disabled={isRestoring}
          >
            {isRestoring ? "..." : "Restore"}
          </S.RestoreButton>
        </S.RestoredHeader>
      </S.RestoredCard>
    );
  };

  if (state.loading) {
    return (
      <S.Wrapper>
        <S.SectionTitle>Restored Buckets</S.SectionTitle>
        <S.Loading>{t("common.loading") || "Loading..."}</S.Loading>
      </S.Wrapper>
    );
  }

  if (state.error) {
    return (
      <S.Wrapper>
        <S.SectionTitle>Restored Buckets</S.SectionTitle>
        <S.Loading>
          {state.error}{" "}
          <button
            onClick={fetchDeleted}
            style={{ marginLeft: 8, color: "#34d399" }}
          >
            {t("common.retry") || "Retry"}
          </button>
        </S.Loading>
      </S.Wrapper>
    );
  }

  // Se não há buckets deletados, não renderiza a seção inteira
  if (state.buckets.length === 0) {
    return null;
  }

  return (
    <S.Wrapper>
      <S.SectionTitle>Deleted Buckets</S.SectionTitle>
      <S.SectionSubtitle>
        These buckets were deleted but can still be restored.
      </S.SectionSubtitle>

      {status && (
        <S.StatusBanner $variant={status.variant}>
          {status.message}
        </S.StatusBanner>
      )}

      {state.buckets.map((bucket) => renderCard(bucket))}
    </S.Wrapper>
  );
}