"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as S from "./styles";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n/useTranslations";

import authmedia from "@/app/assets/auth_media.jpg";

export default function SignUp() {
  const { t } = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("signup.form.passwordsMismatch"));
      return;
    }

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("signup.errors.default"));
        return;
      }

      router.push("/login");
    } catch {
      setError(t("signup.errors.default"));
    }
  }

  return (
    <S.Container>
      <S.Background>
        <Image
          src={authmedia}
          alt={t("signup.alt")}
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </S.Background>
      <S.Overlay />
      <S.Card>
        <S.Header>
          <h1>{t("signup.heading")}</h1>
          <p>{t("signup.subtitle")}</p>
        </S.Header>
        <S.Form onSubmit={handleSubmit}>
          {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
          <S.InputGroup>
            <label>{t("signup.form.nameLabel")}</label>
            <input
              type="text"
              placeholder={t("signup.form.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.InputGroup>
            <label>{t("signup.form.emailLabel")}</label>
            <input
              type="email"
              placeholder={t("signup.form.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.InputGroup>
            <label>{t("signup.form.passwordLabel")}</label>
            <input
              type="password"
              placeholder={t("signup.form.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.InputGroup>
            <label>{t("signup.form.confirmPasswordLabel")}</label>
            <input
              type="password"
              placeholder={t("signup.form.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </S.InputGroup>
          <S.Button type="submit">{t("signup.button")}</S.Button>
          <S.Footer>
            {t("signup.footer.text")}{" "}
            <span onClick={() => router.push("/login")}>
              {t("signup.footer.link")}
            </span>
          </S.Footer>
        </S.Form>
      </S.Card>
    </S.Container>
  );
}
