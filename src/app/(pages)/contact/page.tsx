"use client";
import { Analytics } from "@vercel/analytics/next";

import * as S from "./styles";
import ContactHero from "@/components/contact/contactHero/contactHero";
import ContactForm from "@/components/contact/contactForm/contactForm";
import ContactInfo from "@/components/contact/contactInfo/contactInfo";
import ContactCTA from "@/components/contact/contactCTA/contactCTA";

export default function ContactPage() {
  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <ContactHero />
        <S.Grid>
          <ContactForm />
          <ContactInfo />
        </S.Grid>
        <ContactCTA />
      </S.Content>
    </S.Container>
  );
}
