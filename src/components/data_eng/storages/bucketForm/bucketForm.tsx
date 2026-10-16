"use client";

import { useState, useEffect } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

type Bucket = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  s3_bucket_name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

type Status = { variant: "success" | "error"; message: string } | null;

async function fetchAuthToken(): Promise<string> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Falha ao obter token de autenticação");
  }
  return data.token as string;
}

export default function BucketForm() {
  const { t } = useTranslations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [status, setStatus] = useState<Status>(null);

  const getOrganizationName = (): string => {
    if (typeof window === "undefined") return "";
    return (sessionStorage.getItem("organization_name") || "").trim();
  };

  const loadBuckets = async () => {
    const organizationName = getOrganizationName();
    if (!organizationName) return;

    try {
      const token = await fetchAuthToken();
      const res = await fetch(
        `/api/buckets/list?organization_name=${encodeURIComponent(organizationName)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setBuckets(Array.isArray(data.buckets) ? data.buckets : []);
    } catch {
      
    }
  };

  useEffect(() => {
    loadBuckets();
    
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const organizationName = getOrganizationName();
    if (!organizationName) {
      setStatus({
        variant: "error",
        message: `${t("buckets.errorCreate")}: organization_name ausente`,
      });
      return;
    }

    const formData = new FormData();
    formData.append("organization_name", organizationName);
    formData.append("name", name);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }

    try {
      const token = await fetchAuthToken();

      const res = await fetch("/api/buckets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({
          variant: "error",
          message: `${t("buckets.errorCreate")}: ${data.error || "Unknown error"}`,
        });
        return;
      }

      setStatus({
        variant: "success",
        message: `${t("buckets.buttonCreate")}: ${data.bucket.name}`,
      });

      setName("");
      setDescription("");
      setFile(null);

      await loadBuckets();
    } catch {
      setStatus({
        variant: "error",
        message: `${t("buckets.errorCreate")}: Failed to create bucket`,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFile(file);
  };

  return (
    <S.Form onSubmit={handleSubmit}>
      <S.FormTitle>{t("buckets.title")}</S.FormTitle>

      <S.Field>
        <S.Label htmlFor="bucket_name">{t("buckets.fieldBucketName")}</S.Label>
        <S.Input
          id="bucket_name"
          type="text"
          placeholder={t("buckets.fieldBucketNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </S.Field>

      <S.Field>
        <S.Label htmlFor="description">{t("buckets.fieldDescription")}</S.Label>
        <S.TextArea
          id="description"
          placeholder={t("buckets.fieldDescriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </S.Field>

      <S.Field>
        <S.Label htmlFor="upload_files">{t("buckets.fieldUploadFiles")}</S.Label>
        <S.FileInput
          id="upload_files"
          type="file"
          onChange={handleFileChange}
        />
      </S.Field>

      <S.Row>
        <S.CancelButton type="button">{t("buckets.buttonCancel")}</S.CancelButton>
        <S.SubmitButton type="submit">{t("buckets.buttonCreate")}</S.SubmitButton>
      </S.Row>

      {status && (
        <S.StatusTag $variant={status.variant}>
          {status.message}
        </S.StatusTag>
      )}

      {buckets.length > 0 && (
        <S.Field>
          <S.Label>{t("buckets.title")}</S.Label>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {buckets.map((b) => (
              <li key={b.id} style={{ padding: "4px 0" }}>
                {b.name}
              </li>
            ))}
          </ul>
        </S.Field>
      )}
    </S.Form>
  );
}