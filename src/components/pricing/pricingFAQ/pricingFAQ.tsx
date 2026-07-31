"use client";

import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

export default function PricingFAQ() {
  const { t } = useTranslations();

  const faqs = t("pricing.faq.items") as unknown as Array<{ q: string; a: string }>;

  return (
    <section>
      <S.SectionHead>
        <S.SectionTitle>{t("pricing.faq.title")}</S.SectionTitle>
      </S.SectionHead>
      <S.Grid>
        {Array.isArray(faqs) && faqs.map((faq, i) => (
          <S.Item key={i}>
            <S.Summary>
              {faq.q}
              <S.Plus className="plus">+</S.Plus>
            </S.Summary>
            <S.Answer>{faq.a}</S.Answer>
          </S.Item>
        ))}
      </S.Grid>
    </section>
  );
}
