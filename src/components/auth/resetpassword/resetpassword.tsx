"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as S from "./styles";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n/useTranslations";

import authmedia from "@/app/assets/auth_media.jpg";

interface Props {
  token: string;
}

export default function ResetPassword({ token }: Props) {
  const { t } = useTranslations();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function getToken(): Promise<string> {
    const res = await fetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) throw new Error("token failed");
    const data = await res.json();
    return data.token;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("resetpassword.errors.passwordsMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("resetpassword.errors.tooShort"));
      return;
    }

    setLoading(true);

    try {
      const jwt = await getToken();

      const res = await fetch("/api/auth/resetpassword/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("resetpassword.errors.default"));
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t("resetpassword.errors.default"));
      setLoading(false);
    }
  }

  if (success) {
    return (
      <S.Container>
        <S.Background>
          <Image src={authmedia} alt={t("resetpassword.alt")} fill priority style={{ objectFit: "cover" }} />
        </S.Background>
        <S.Overlay />
        <S.Card>
          <S.Header>
            <h1>{t("resetpassword.successTitle")}</h1>
            <p>{t("resetpassword.successMessage")}</p>
          </S.Header>
          <S.Button onClick={() => router.push("/login")}>
            {t("resetpassword.backToLogin")}
          </S.Button>
        </S.Card>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Background>
        <Image src={authmedia} alt={t("resetpassword.alt")} fill priority style={{ objectFit: "cover" }} />
      </S.Background>
      <S.Overlay />
      <S.Card>
        <S.Header>
          <h1>{t("resetpassword.heading")}</h1>
          <p>{t("resetpassword.subtitle")}</p>
        </S.Header>
        <S.Form onSubmit={handleSubmit}>
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
          <S.InputGroup>
            <label>{t("resetpassword.form.newPasswordLabel")}</label>
            <input
              type="password"
              placeholder={t("resetpassword.form.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.InputGroup>
            <label>{t("resetpassword.form.confirmPasswordLabel")}</label>
            <input
              type="password"
              placeholder={t("resetpassword.form.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.Button type="submit" disabled={loading}>
            {loading ? t("resetpassword.button") + "..." : t("resetpassword.button")}
          </S.Button>
        </S.Form>
      </S.Card>
    </S.Container>
  );
}
