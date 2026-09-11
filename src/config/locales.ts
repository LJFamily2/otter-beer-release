/**
 * Central registry of content languages.
 *
 * This drives every "multi-language input" field in the admin (news & blog today,
 * future modules later). To add a new language, add one entry here — no schema
 * or migration changes are needed because translations are stored as an array
 * of {locale, ...fields} subdocuments (see src/models/BlogPost.ts).
 *
 * This is separate from the admin UI language, which is Vietnamese-only and not
 * driven by this list (see docs/internationalization.md).
 */

export interface LocaleDefinition {
  /** BCP-47-ish short code used as the storage key and URL segment. */
  code: string;
  /** Label shown in the admin UI (Vietnamese, since the admin is VI-only). */
  label: string;
  /** Whether content in this locale is required before a post can be published. */
  required: boolean;
}

export const LOCALES: readonly LocaleDefinition[] = [
  { code: "vi", label: "Tiếng Việt", required: true },
  { code: "en", label: "Tiếng Anh", required: false },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const SUPPORTED_LOCALE_CODES: readonly LocaleCode[] = LOCALES.map(
  (l) => l.code
);

export const DEFAULT_LOCALE: LocaleCode = "vi";

export function isSupportedLocale(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALE_CODES as readonly string[]).includes(value);
}

export function getRequiredLocales(): LocaleCode[] {
  return LOCALES.filter((l) => l.required).map((l) => l.code);
}
