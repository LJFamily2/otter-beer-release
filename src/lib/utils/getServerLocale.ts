import { headers } from "next/headers";
import { DEFAULT_LOCALE, isSupportedLocale, type LocaleCode } from "@/config/locales";

/**
 * Reads the locale proxy.ts forwarded via the `x-locale` request header —
 * the same signal the root layout uses for `<html lang>`. Admin routes
 * never set this header, so they always resolve to the vi default, matching
 * the admin panel's VI-only requirement.
 */
export async function getServerLocale(): Promise<LocaleCode> {
  const headerList = await headers();
  const lang = headerList.get("x-locale");
  return lang && isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
}
