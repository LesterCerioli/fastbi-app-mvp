"use client";

import { createContext, useState, useCallback, ReactNode, useEffect } from "react";
import { defaultLocale, type Locale } from "./config";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  loading: boolean;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  loading: false,
});

const STORAGE_KEY = "fastbi_locale";

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLoading(true);
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    setLoading(false);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, loading }}>
      {children}
    </I18nContext.Provider>
  );
}
