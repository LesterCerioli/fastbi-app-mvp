"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export interface BucketDetailsModalBucket {
  id: string;
  name: string;
  description?: string | null;
  s3_bucket_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface BucketDetailsModalProps {
  organizationName: string;
  bucket: BucketDetailsModalBucket;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
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

export default function BucketDetailsModal({
  organizationName,
  bucket,
  onClose,
  onChanged,
}: BucketDetailsModalProps) {
  const { t } = useTranslations();

  const [name, setName] = useState(bucket.name);
  const [description, setDescription] = useState(bucket.description ?? "");
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trimmedName = name.trim();
  const canSave =
    trimmedName.length > 0 &&
    (trimmedName !== bucket.name || description !== (bucket.description ?? ""));

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setStatus(null);

    try {
      const token = await fetchAuthToken();
      const payload: Record<string, unknown> = {
        organization_name: organizationName,
        name: bucket.name,
      };
      if (trimmedName !== bucket.name) payload.new_name = trimmedName;
      if (description !== (bucket.description ?? "")) {
        payload.new_description = description;
      }

      const res = await fetch("/api/buckets/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          variant: "error",
          message: `${t("buckets.errorCreate")}: ${data.error || "Unknown error"}`,
        });
        return;
      }

      setStatus({ variant: "success", message: t("common.saved") || "Salvo" });
      await onChanged();
    } catch (err) {
      setStatus({
        variant: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus(null);

    try {
      const token = await fetchAuthToken();
      const formData = new FormData();
      formData.append("organization_name", organizationName);
      formData.append("name", bucket.name);
      formData.append("file", file);

      const res = await fetch("/api/buckets/manage/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          variant: "error",
          message: `${t("buckets.errorCreate")}: ${data.error || "Unknown error"}`,
        });
        return;
      }

      setStatus({
        variant: "success",
        message: t("common.uploaded") || "Upload OK",
      });
      setFile(null);
      await onChanged();
    } catch (err) {
      setStatus({
        variant: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setStatus(null);

    try {
      const token = await fetchAuthToken();
      const res = await fetch("/api/buckets/manage", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: organizationName,
          name: bucket.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          variant: "error",
          message: `${t("buckets.errorCreate")}: ${data.error || "Unknown error"}`,
        });
        return;
      }
      await onChanged();
      onClose();
    } catch (err) {
      setStatus({
        variant: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <S.Overlay onClick={onClose}>
      <S.Modal onClick={(e) => e.stopPropagation()}>
        <S.Header>
          <S.Title>{bucket.name}</S.Title>
          <S.CloseButton type="button" onClick={onClose} aria-label="Close">
            ✕
          </S.CloseButton>
        </S.Header>

        <S.Section>
          <S.Label>{t("buckets.fieldBucketName")}</S.Label>
          <S.Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </S.Section>

        <S.Section>
          <S.Label>{t("buckets.fieldDescription")}</S.Label>
          <S.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </S.Section>

        <S.Row>
          <S.PrimaryButton
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? "..." : t("common.save") || "Salvar"}
          </S.PrimaryButton>
        </S.Row>

        <S.Divider />

        <S.Section>
          <S.Label>{t("buckets.fieldUploadFiles")}</S.Label>
          <S.FileInput
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </S.Section>

        <S.Row>
          <S.PrimaryButton
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "..." : t("common.upload") || "Enviar"}
          </S.PrimaryButton>
        </S.Row>

        <S.Divider />

        {!confirmDelete ? (
          <S.Row>
            <S.DangerButton type="button" onClick={() => setConfirmDelete(true)}>
              {t("buckets.buttonCancel") || "Delete"}
            </S.DangerButton>
          </S.Row>
        ) : (
          <S.ConfirmBox>
            <S.ConfirmText>
              {t("common.confirmDelete") || "Confirmar exclusão?"}
            </S.ConfirmText>
            <S.Row>
              <S.SecondaryButton
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                {t("common.cancel") || "Cancelar"}
              </S.SecondaryButton>
              <S.DangerButton
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "..." : t("common.confirm") || "Confirmar"}
              </S.DangerButton>
            </S.Row>
          </S.ConfirmBox>
        )}

        {status && (
          <S.StatusTag $variant={status.variant}>{status.message}</S.StatusTag>
        )}
      </S.Modal>
    </S.Overlay>
  );
}