"use client";

import { useContext, useCallback } from "react";
import { I18nContext } from "./I18nProvider";
import en from "./translations/en.json";
import ptBR from "./translations/pt-BR.json";
import es from "./translations/es.json";
import zh from "./translations/zh.json";
import ja from "./translations/ja.json";
import it from "./translations/it.json";
import de from "./translations/de.json";
import type { Locale } from "./config";

const translations: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  "pt-BR": ptBR as Record<string, unknown>,
  es: es as Record<string, unknown>,
  zh: zh as Record<string, unknown>,
  ja: ja as Record<string, unknown>,
  it: it as Record<string, unknown>,
  de: de as Record<string, unknown>,
};

function getNested(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  if (typeof current === "string") return current;
  if (Array.isArray(current)) return path;
  return path;
}

export function useTranslations() {
  const { locale } = useContext(I18nContext);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const data = translations[locale] || translations.en;
      let value = getNested(data, key);
      if (value === key) {
        value = getNested(translations.en, key);
      }
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [locale]
  );

  return { t, locale };
}
