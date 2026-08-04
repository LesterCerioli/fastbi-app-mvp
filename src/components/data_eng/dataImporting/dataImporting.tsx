"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

const ACCEPTED_EXTENSIONS = ".csv,.xls";

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

function getCurrentUserId(): string {
  const stored = sessionStorage.getItem("user");
  if (!stored) return "";
  try {
    const user = JSON.parse(stored);
    return user?.id || "";
  } catch {
    return "";
  }
}

function getCurrentOrganizationName(): string {
  return sessionStorage.getItem("organization_name") || "";
}

export default function DataImporting() {
  const { t } = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCardClick = () => {
    if (isUploading) return;
    setMessage(null);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (ext !== "csv" && ext !== "xls") {
      setMessage({
        type: "error",
        text: "Upload not possible. Only .csv or .xls files are allowed.",
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const token = await getFreshToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", getCurrentUserId());
      formData.append("organization_name", getCurrentOrganizationName());

      const res = await fetch("/api/users/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || t("dataeng.dataImporting.uploadError"),
        });
        return;
      }

      setMessage({
        type: "success",
        text: t("dataeng.dataImporting.success"),
      });
    } catch {
      setMessage({
        type: "error",
        text: t("dataeng.dataImporting.serverError"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <S.Wrapper>
      <S.Card
        type="button"
        onClick={handleCardClick}
        disabled={isUploading}
        title={t("dataeng.dataImporting.title")}
      >
        <S.Icon>
          <Paperclip size={22} />
        </S.Icon>
        <S.Label>
          <S.Title>{t("dataeng.dataImporting.title")}</S.Title>
          <S.Hint>Only files .csv or .xls</S.Hint>
        </S.Label>
        {isUploading && <S.Spinner />}
      </S.Card>

      <S.FileInput
        ref={fileRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {message && (
        <S.Message $type={message.type}>
          {message.type === "success" ? "\u2713" : "\u2717"} {message.text}
        </S.Message>
      )}
    </S.Wrapper>
  );
}
