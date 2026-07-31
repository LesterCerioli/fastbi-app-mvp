import type { Locale } from "./config";

type CurrencyConfig = {
  code: string;
  symbol: string;
  rate: number;
};

const currencyMap: Record<Locale, CurrencyConfig> = {
  en: { code: "USD", symbol: "$", rate: 1 },
  "pt-BR": { code: "BRL", symbol: "R$", rate: 5.16 },
  es: { code: "EUR", symbol: "€", rate: 0.92 },
  zh: { code: "CNY", symbol: "¥", rate: 7.24 },
  ja: { code: "JPY", symbol: "¥", rate: 149 },
  it: { code: "EUR", symbol: "€", rate: 0.92 },
  de: { code: "EUR", symbol: "€", rate: 0.92 },
};

export function getCurrencyConfig(locale: Locale): CurrencyConfig {
  return currencyMap[locale] || currencyMap.en;
}

export function formatPrice(
  usdAmount: number,
  locale: Locale,
  annual: boolean,
): { symbol: string; value: string; suffix: string } {
  const config = getCurrencyConfig(locale);
  const converted = usdAmount * config.rate;
  const rounded = config.code === "JPY" ? Math.round(converted) : Math.round(converted * 100) / 100;

  const formatted = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: config.code === "JPY" ? 0 : 2,
    maximumFractionDigits: config.code === "JPY" ? 0 : 2,
  }).format(rounded);

  return {
    symbol: config.symbol,
    value: formatted,
    suffix: "/user / mo",
  };
}
