"use client";

import { useState, useEffect } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import BucketDetailsModal from "../bucketDetailsModal/bucketDetailsModal";

const BUCKETS_API = "/api/buckets/list";
const MANAGE_API = "/api/buckets/manage";

export interface Bucket {
  id: string;
  name: string;
  description?: string | null;
  s3_bucket_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface BucketListProps {
  organizationName?: string;
  onDeleted?: () => void;
}

interface BucketListState {
  buckets: Bucket[];
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

export default function BucketList({ organizationName, onDeleted }: BucketListProps) {
  const { t } = useTranslations();
  const [state, setState] = useState<BucketListState>({
    buckets: [],
    loading: true,
    error: null,
  });
  const [selected, setSelected] = useState<Bucket | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [confirmingBucket, setConfirmingBucket] = useState<Bucket | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const orgName = (organizationName || getOrganizationNameFromStorage()).trim();

  useEffect(() => {
    fetchBuckets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgName]);

  const fetchBuckets = async () => {
    if (!orgName) {
      setState({ buckets: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const token = await fetchAuthToken();
      const res = await fetch(
        `${BUCKETS_API}?organization_name=${encodeURIComponent(orgName)}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch buckets");

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

  const requestDelete = (e: React.MouseEvent, bucket: Bucket) => {
    e.stopPropagation();
    setStatus(null);
    setConfirmingBucket(bucket);
  };

  const confirmDelete = async () => {
    const bucket = confirmingBucket;
    if (!bucket) return;

    setDeletingName(bucket.name);
    try {
      const token = await fetchAuthToken();
      const res = await fetch(MANAGE_API, {
        method: "DELETE",
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
          message: `${t("buckets.errorDelete") || "Falha ao deletar"}: ${
            data.error || "Unknown error"
          }`,
        });
        setConfirmingBucket(null);
        return;
      }

      setState((prev) => ({
        ...prev,
        buckets: prev.buckets.filter((b) => b.id !== bucket.id),
      }));

      // ⬇️ NOVO: avisa o pai para recarregar a seção de buckets deletados
      onDeleted?.();

      setStatus({
        variant: "success",
        message: `${
          t("buckets.deleted") || "Bucket deletado"
        }: ${bucket.name}`,
      });
      setConfirmingBucket(null);
    } catch (err) {
      setStatus({
        variant: "error",
        message: `${t("buckets.errorDelete") || "Falha ao deletar"}: ${
          err instanceof Error ? err.message : "Erro desconhecido"
        }`,
      });
      setConfirmingBucket(null);
    } finally {
      setDeletingName(null);
    }
  };

  const renderBucketCard = (bucket: Bucket) => {
    const isDeleting = deletingName === bucket.name;

    return (
      <S.BucketCard
        key={bucket.id}
        onClick={() => setSelected(bucket)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(bucket);
          }
        }}
      >
        <S.BucketHeader>
          <S.BucketIcon>
            {(bucket.name || "?").charAt(0).toUpperCase()}
          </S.BucketIcon>

          <S.BucketInfo>
            <S.BucketName>{bucket.name}</S.BucketName>
            <S.BucketDesc>
              {bucket.description || t("buckets.fieldDescription")}
            </S.BucketDesc>
          </S.BucketInfo>

          <S.DeleteButton
            type="button"
            onClick={(e) => requestDelete(e, bucket)}
            disabled={isDeleting}
            title="Delete bucket"
            aria-label={`Delete bucket ${bucket.name}`}
          >
            {isDeleting ? "..." : "Delete"}
          </S.DeleteButton>
        </S.BucketHeader>
      </S.BucketCard>
    );
  };

  if (state.loading) {
    return (
      <S.Wrapper>
        <S.Loading>{t("common.loading")}</S.Loading>
        <S.SkeletonCard />
        <S.SkeletonRow />
        <S.SkeletonRow />
        <S.SkeletonRow />
      </S.Wrapper>
    );
  }

  if (state.error) {
    return (
      <S.Wrapper>
        <S.Loading>
          {state.error}{" "}
          <button
            onClick={fetchBuckets}
            style={{ marginLeft: 8, color: "#34d399" }}
          >
            {t("common.retry")}
          </button>
        </S.Loading>
      </S.Wrapper>
    );
  }

  if (state.buckets.length === 0) {
    return (
      <>
        {status && (
          <S.Wrapper>
            <S.StatusBanner $variant={status.variant}>
              {status.message}
            </S.StatusBanner>
          </S.Wrapper>
        )}
      </>
    );
  }

  return (
    <>
      <S.Wrapper>
        {status && (
          <S.StatusBanner $variant={status.variant}>
            {status.message}
          </S.StatusBanner>
        )}
        {state.buckets.map((bucket) => renderBucketCard(bucket))}
      </S.Wrapper>

      {selected && (
        <BucketDetailsModal
          organizationName={orgName}
          bucket={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            setSelected(null);
            await fetchBuckets();
          }}
        />
      )}

      {confirmingBucket && (
        <S.ConfirmOverlay onClick={() => setConfirmingBucket(null)}>
          <S.ConfirmDialog onClick={(e) => e.stopPropagation()}>
            <S.ConfirmTitle>Delete bucket?</S.ConfirmTitle>
            <S.ConfirmMessage>
              Are you sure you want to delete the bucket{" "}
              <S.ConfirmBucketName>
                &quot;{confirmingBucket.name}&quot;
              </S.ConfirmBucketName>
              ? This action cannot be undone.
            </S.ConfirmMessage>
            <S.ConfirmActions>
              <S.ConfirmCancel
                type="button"
                onClick={() => setConfirmingBucket(null)}
                disabled={deletingName === confirmingBucket.name}
              >
                Cancel
              </S.ConfirmCancel>
              <S.ConfirmDelete
                type="button"
                onClick={confirmDelete}
                disabled={deletingName === confirmingBucket.name}
              >
                {deletingName === confirmingBucket.name ? "..." : "Confirm"}
              </S.ConfirmDelete>
            </S.ConfirmActions>
          </S.ConfirmDialog>
        </S.ConfirmOverlay>
      )}
    </>
  );
}