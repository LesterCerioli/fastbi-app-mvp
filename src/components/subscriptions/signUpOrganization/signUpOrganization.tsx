"use client";

import { useState } from "react";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { OrganizationData } from "@/components/subscriptions/signUp/signUp";

interface Props {
  onContinue: (data: OrganizationData) => void;
}

export default function SignUpOrganization({ onContinue }: Props) {
  const { t } = useTranslations();
  const [organizationName, setOrganizationName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!organizationName.trim()) {
      setError(t("subscriptions.signUp.organization.errors.nameRequired"));
      return;
    }
    if (!taxId.trim()) {
      setError(t("subscriptions.signUp.organization.errors.taxIdRequired"));
      return;
    }
    if (!address.trim()) {
      setError(t("subscriptions.signUp.organization.errors.addressRequired"));
      return;
    }

    onContinue({
      organizationName: organizationName.trim(),
      taxId: taxId.trim(),
      address: address.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <S.Title>
        {t("subscriptions.signUp.organization.title")}
      </S.Title>
      <S.Subtitle>
        {t("subscriptions.signUp.organization.subtitle")}
      </S.Subtitle>

      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}

      <S.Form>
        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.organization.fields.name")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="text"
            placeholder={t("subscriptions.signUp.organization.placeholders.name")}
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.organization.fields.taxId")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="text"
            placeholder={t("subscriptions.signUp.organization.placeholders.taxId")}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </S.Field>

        <S.Field>
          <S.Label>
            {t("subscriptions.signUp.organization.fields.address")}
            <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            type="text"
            placeholder={t("subscriptions.signUp.organization.placeholders.address")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </S.Field>
      </S.Form>

      <S.ButtonRow>
        <S.Button type="submit">
          {t("subscriptions.signUp.organization.continue")}
        </S.Button>
      </S.ButtonRow>
    </form>
  );
}
