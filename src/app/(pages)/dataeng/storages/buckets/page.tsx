"use client";

import Link from "next/link";
import * as S from "./styles";
import BucketForm from "@/components/data_eng/storages/bucketForm/bucketForm";
import BucketList from "@/components/data_eng/storages/bucketList/bucketList";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function BucketsPage() {
  const { t } = useTranslations();

  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <S.SectionHead>
          <S.BackLink href="/dataeng/storages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>{t("common.back")}</span>
          </S.BackLink>
          <S.SectionTitle>{t("buckets.title")}</S.SectionTitle>
          <S.SectionSubtitle>{t("buckets.subtitle")}</S.SectionSubtitle>
        </S.SectionHead>

        <BucketForm />

        <BucketList
          onDelete={(id) => console.log("Delete bucket:", id)}
          onSelect={(bucket) => console.log("Select bucket:", bucket)}
        />

      </S.Content>
    </S.Container>
  );
}