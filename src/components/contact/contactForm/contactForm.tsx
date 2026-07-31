"use client";

import { useState, FormEvent } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function ContactForm() {
  const { t } = useTranslations();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <S.Form as="div">
        <S.FormTitle>{t("contact.form.successTitle")}</S.FormTitle>
        <p style={{ color: "#9db3b8", lineHeight: 1.6 }}>
          {t("contact.form.successMessage")}
        </p>
      </S.Form>
    );
  }

  return (
    <S.Form onSubmit={handleSubmit}>
      <S.FormTitle>{t("contact.form.title")}</S.FormTitle>
      <S.Field>
        <S.Label htmlFor="name">{t("contact.form.fields.name.label")}</S.Label>
        <S.Input id="name" type="text" placeholder={t("contact.form.fields.name.placeholder")} required />
      </S.Field>
      <S.Field>
        <S.Label htmlFor="email">{t("contact.form.fields.email.label")}</S.Label>
        <S.Input id="email" type="email" placeholder={t("contact.form.fields.email.placeholder")} required />
      </S.Field>
      <S.Field>
        <S.Label htmlFor="subject">{t("contact.form.fields.subject.label")}</S.Label>
        <S.Input id="subject" type="text" placeholder={t("contact.form.fields.subject.placeholder")} required />
      </S.Field>
      <S.Field>
        <S.Label htmlFor="message">{t("contact.form.fields.message.label")}</S.Label>
        <S.TextArea id="message" placeholder={t("contact.form.fields.message.placeholder")} required />
      </S.Field>
      <S.SubmitButton type="submit">{t("contact.form.submit")}</S.SubmitButton>
    </S.Form>
  );
}
