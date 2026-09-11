const FORMATTERS: Record<string, Intl.DateTimeFormat> = {
  vi: new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
};

/** Shared date display format for admin tables and public post dates — vi is the fallback for any locale without its own formatter. */
export function formatDate(date: Date, locale: string): string {
  return (FORMATTERS[locale] ?? FORMATTERS.vi).format(date);
}
