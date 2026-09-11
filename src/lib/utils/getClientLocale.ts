import { DEFAULT_LOCALE, isSupportedLocale, type LocaleCode } from "@/config/locales";

/**
 * Client-side counterpart to getServerLocale.ts — for Client Components
 * (e.g. error.tsx, which must be a Client Component and can't call
 * next/headers()) that need the current locale. Reads `<html lang>`, which
 * the root layout already sets server-side from the same x-locale signal.
 */
export function getClientLocale(): LocaleCode {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const lang = document.documentElement.lang;
  return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
}
