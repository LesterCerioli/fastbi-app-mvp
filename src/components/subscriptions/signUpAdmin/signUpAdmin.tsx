"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { AdminData } from "@/components/subscriptions/signUp/signUp";

interface Props {
  onContinue: (data: AdminData) => void;
  onBack?: () => void;
}

export default function SignUpAdmin({ onContinue, onBack }: Props) {
  const { t } = useTranslations();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError(t("subscriptions.signUp.admin.errors.nameRequired"));
      return;
    }
    if (!email.trim()) {
      setError(t("subscriptions.signUp.admin.errors.emailRequired"));
      return;
    }
    if (!password) {
      setError(t("subscriptions.signUp.admin.errors.passwordRequired"));
      return;
    }
    if (password.length < 8) {
      setError(t("subscriptions.signUp.admin.errors.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("subscriptions.signUp.admin.errors.passwordsMismatch"));
      return;
    }

    onContinue({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <S.Title>
        {t("subscriptions.signUp.admin.title")}
      </S.Title>
      <S.Subtitle>
        {t("subscriptions.signUp.admin.subtitle")}
      </S.Subtitle>

      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

      <S.Form>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.admin.fields.fullName")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="text"
            placeholder={t("subscriptions.signUp.admin.placeholders.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.admin.fields.email")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="email"
            placeholder={t("subscriptions.signUp.admin.placeholders.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.admin.fields.password")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="password"
            placeholder={t("subscriptions.signUp.admin.placeholders.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.admin.fields.confirmPassword")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="password"
            placeholder={t("subscriptions.signUp.admin.placeholders.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </S.Field>
      </S.Form>

      <S.ButtonRow>
        {onBack && (
          <S.BackButton type="button" onClick={onBack}>
            {t("common.back")}
          </S.BackButton>
        )}
        <S.Button type="submit">
          {t("subscriptions.signUp.admin.continue")}
        </S.Button>
      </S.ButtonRow>
    </form>
  );
}
