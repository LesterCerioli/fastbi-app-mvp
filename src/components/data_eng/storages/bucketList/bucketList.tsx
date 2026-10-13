"use client";

import { useState, useEffect } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

const BUCKETS_API = "/api/dataeng/buckets";

interface Bucket {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount?: number;
}

interface BucketListProps {
  organizationName?: string;
  onDelete?: (bucketId: string) => void;
  onSelect?: (bucket: Bucket) => void;
}

interface BucketListState {
  buckets: Bucket[];
  loading: boolean;
  error: string | null;
}

export default function BucketList({
  organizationName,
  onDelete,
  onSelect,
}: BucketListProps) {
  const { t } = useTranslations();
  const [state, setState] = useState<BucketListState>({
    buckets: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchBuckets();
  }, [organizationName]);

  const fetchBuckets = async () => {
    if (!organizationName) {
      setState({ buckets: [], loading: false, error: null });
      return;
    }

    setState({ ...state, loading: true });

    try {
      const res = await fetch(`${BUCKETS_API}?organization=${organizationName}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch buckets");

      const data = await res.json();
      setState({ buckets: data.buckets || [], loading: false, error: null });
    } catch (err) {
      setState({
        buckets: state.buckets,
        loading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  };

  const handleDelete = async (bucketId: string) => {
    if (!onDelete) return;

    setState((prev) => ({
      ...prev,
      buckets: prev.buckets.filter((b) => b.id !== bucketId),
    }));

    try {
      const res = await fetch(`${BUCKETS_API}/${bucketId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to delete bucket");

      fetchBuckets();
    } catch (err) {
      // Re-fetch to restore state if delete fails
      fetchBuckets();
    }
  };

  const renderBucketCard = (bucket: Bucket) => (
    <S.BucketCard onClick={() => onSelect?.(bucket)}>
      <S.BucketHeader>
        <S.BucketIcon>{bucket.name.charAt(0)}</S.BucketIcon>
        <S.BucketInfo>
          <S.BucketName>{bucket.name}</S.BucketName>
          <S.BucketDesc>
            {bucket.description || t("buckets.fieldDescription")}
          </S.BucketDesc>
        </S.BucketInfo>
      </S.BucketHeader>

      <S.BucketActions>
        {onDelete && (
          <S.DeleteButton onClick={() => handleDelete(bucket.id)}>
            {t("buckets.buttonCancel")}
          </S.DeleteButton>
        )}
      </S.BucketActions>
    </S.BucketCard>
  );

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

  if (state.buckets.length === 0 && !state.loading) {
    return (
      <S.Wrapper>
        <S.Empty>{t("common.empty")}</S.Empty>
      </S.Wrapper>
    );
  }

  if (state.error) {
    return (
      <S.Wrapper>
        <S.Loading>
          {state.error}{" "}
          <button onClick={fetchBuckets} style={{ marginLeft: 8, color: "#34d399" }}>
            {t("common.retry")}
          </button>
        </S.Loading>
      </S.Wrapper>
    );
  }

  return (
    <S.Wrapper>
      {state.buckets.map((bucket) => renderBucketCard(bucket))}
    </S.Wrapper>
  );
}