"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as S from "./styles";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n/useTranslations";

import authmedia from "@/app/assets/auth_media.jpg";

export default function ForgotPassword() {
  const { t } = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      const token = await getToken();

      const res = await fetch("/api/auth/resetpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("forgotpassword.errors.default"));
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError(t("forgotpassword.errors.default"));
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <S.Container>
        <S.Background>
          <Image src={authmedia} alt={t("forgotpassword.alt")} fill priority style={{ objectFit: "cover" }} />
        </S.Background>
        <S.Overlay />
        <S.Card>
          <S.Header>
            <h1>{t("forgotpassword.successTitle")}</h1>
            <p>{t("forgotpassword.successMessage")}</p>
          </S.Header>
          <S.Button onClick={() => router.push("/login")}>
            {t("forgotpassword.backToLogin")}
          </S.Button>
        </S.Card>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Background>
        <Image src={authmedia} alt={t("forgotpassword.alt")} fill priority style={{ objectFit: "cover" }} />
      </S.Background>
      <S.Overlay />
      <S.Card>
        <S.Header>
          <h1>{t("forgotpassword.heading")}</h1>
          <p>{t("forgotpassword.subtitle")}</p>
        </S.Header>
        <S.Form onSubmit={handleSubmit}>
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
          <S.InputGroup>
            <label>{t("forgotpassword.form.emailLabel")}</label>
            <input
              type="email"
              placeholder={t("forgotpassword.form.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.Button type="submit" disabled={loading}>
            {loading ? t("forgotpassword.button") + "..." : t("forgotpassword.button")}
          </S.Button>
          <S.Footer>
            <span onClick={() => router.push("/login")}>
              {t("forgotpassword.footer")}
            </span>
          </S.Footer>
        </S.Form>
      </S.Card>
    </S.Container>
  );
}
