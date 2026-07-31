"use client";
import { Analytics } from "@vercel/analytics/next";

import { useState } from "react";
import * as S from "./styles";
import PricingHero from "@/components/pricing/pricingHero/pricingHero";
import PricingCards from "@/components/pricing/pricingCards/pricingCards";
import PricingEnterprise from "@/components/pricing/pricingEnterprise/pricingEnterprise";
import PricingComparison from "@/components/pricing/pricingComparison/pricingComparison";
import PricingFAQ from "@/components/pricing/pricingFAQ/pricingFAQ";
import PricingCTA from "@/components/pricing/pricingCTA/pricingCTA";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <S.Container>
      <S.PageBg />
      <S.Content>
        <PricingHero annual={annual} onToggle={setAnnual} />
        <PricingCards annual={annual} />
        <PricingEnterprise />
        <PricingComparison />
        <PricingFAQ />
        <PricingCTA />
      </S.Content>
    </S.Container>
  );
}
