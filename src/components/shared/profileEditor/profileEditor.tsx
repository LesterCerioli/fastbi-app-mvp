"use client";

import { useState, useRef, useEffect } from "react";
import * as S from "./styles";
import { roles, getRoleLabelKey } from "@/lib/roles";
import { useTranslations } from "@/lib/i18n/useTranslations";

interface ProfileEditorProps {
  userId: string;
  initialName?: string;
  initialRole?: string;
  onClose?: () => void;
}

async function getFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch { return null; }
}

export default function ProfileEditor({ userId, initialName, initialRole, onClose }: ProfileEditorProps) {
  const { t } = useTranslations();
  const [name, setName] = useState(initialName || "");
  const [role, setRole] = useState(initialRole || "viewer");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`/api/users/avatar?userId=${userId}`, { headers });
      const data = await r.json();
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
    })();
  }, [userId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const res = await fetch("/api/users/avatar", { method: "POST", headers, body: formData });
      const data = await res.json();

      if (res.ok) {
        setAvatarUrl(data.avatar_url);
        setMessage({ text: t("profileEditor.avatarUploaded") });
      } else {
        setMessage({ text: data.error || t("profileEditor.uploadError"), error: true });
      }
    } catch {
      setMessage({ text: t("profileEditor.uploadError"), error: true });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = await getFreshToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ userId, name, role }),
      });

      if (res.ok) {
        setMessage({ text: t("profileEditor.saved") });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || t("profileEditor.saveError"), error: true });
      }
    } catch {
      setMessage({ text: t("profileEditor.saveError"), error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <S.Container>
      <S.Title>{t("profileEditor.title")}</S.Title>

      <S.AvatarWrapper>
        {avatarUrl ? (
          <S.AvatarPreview src={avatarUrl} alt="Avatar" />
        ) : (
          <S.AvatarPlaceholder>
            {name.charAt(0).toUpperCase() || "?"}
          </S.AvatarPlaceholder>
        )}
        <div>
          <S.FileInput type="file" ref={fileRef} onChange={handleAvatarUpload} accept="image/*" />
        </div>
      </S.AvatarWrapper>

      <S.FieldGroup>
        <S.Label>{t("profileEditor.name")}</S.Label>
        <S.Input value={name} onChange={(e) => setName(e.target.value)} />
      </S.FieldGroup>

      <S.FieldGroup>
        <S.Label>{t("profileEditor.role")}</S.Label>
        <S.Select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {t(getRoleLabelKey(r.id))}
            </option>
          ))}
        </S.Select>
      </S.FieldGroup>

      <S.Button onClick={handleSave} disabled={saving}>
        {saving ? t("profileEditor.saving") : t("profileEditor.save")}
      </S.Button>

      {message && <S.Message $error={message.error}>{message.text}</S.Message>}
    </S.Container>
  );
}
