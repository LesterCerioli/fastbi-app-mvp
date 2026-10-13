"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function BucketForm() {
  const { t, locale } = useTranslations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }
    // Submit logic would be handled by parent component
    alert(t("buckets.buttonCreate") + ": " + name);
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
    </S.Form>
  );
}