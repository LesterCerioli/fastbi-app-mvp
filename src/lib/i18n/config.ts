export const defaultLocale = "en";

export const locales = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

export type Locale = (typeof locales)[number]["code"];
