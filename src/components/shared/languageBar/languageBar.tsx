"use client";

import { useContext, useState, useRef, useEffect } from "react";
import * as S from "./styles";
import { I18nContext } from "@/lib/i18n/I18nProvider";
import { locales } from "@/lib/i18n/config";

export default function LanguageBar() {
  const { locale, setLocale } = useContext(I18nContext);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const currentLocale = locales.find((l) => l.code === locale);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <S.Bar>
      <S.LangWrapper ref={langRef}>
        <S.LangButton onClick={() => setLangOpen(!langOpen)}>
          {currentLocale?.flag} <S.LangLabel>{currentLocale?.label}</S.LangLabel>
        </S.LangButton>
        {langOpen && (
          <S.LangDropdown>
            {locales.map((loc) => (
              <S.LangOption
                key={loc.code}
                $active={loc.code === locale}
                onClick={() => { setLocale(loc.code); setLangOpen(false); }}
              >
                {loc.flag} {loc.label}
              </S.LangOption>
            ))}
          </S.LangDropdown>
        )}
      </S.LangWrapper>
    </S.Bar>
  );
}
