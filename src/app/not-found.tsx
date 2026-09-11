import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/utils/getServerLocale";
import { getServerAppSection } from "@/lib/utils/getServerAppSection";
import { localizedPath } from "@/lib/seo";
import { buttonVariants } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

const COPY = {
  vi: {
    heading: "Hết bia rồi! Trang này đã cạn sạch.",
    home: "Về trang chủ",
    browse: "Khám phá Blog",
  },
  en: {
    heading: "Drained! This page has gone dry.",
    home: "Return Home",
    browse: "Browse Our Brews",
  },
} as const;

/**
 * Root-level not-found — Next.js renders this for both unmatched URLs
 * anywhere in the app and any explicit notFound() call in a segment that
 * doesn't define its own not-found.tsx (blog/[slug], admin edit-post,
 * etc.). Deliberately outside (marketing)/layout.tsx and the admin shell —
 * only wrapped by the bare root layout — matching the Figma design's
 * "navigation shell suppressed" note for error pages.
 *
 * Shared by both route trees, so the recovery actions branch on
 * getServerAppSection(): a marketing 404 links out to "/" and "/blog" (the
 * Figma design), but an admin 404 must never do that — it goes back via
 * browser history instead, falling back to /admin if there's no history.
 */
export default async function NotFound() {
  const [locale, section] = await Promise.all([
    getServerLocale(),
    getServerAppSection(),
  ]);
  // config/locales.ts's LocaleCode resolves to plain `string` (its source
  // field isn't a literal union), so TS can't narrow this index on its
  // own — safe here since getServerLocale() only ever returns a key of COPY.
  const copy = COPY[locale as keyof typeof COPY];

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface px-16 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 50% 45%, rgba(29,63,130,0.08) 0%, rgba(29,63,130,0) 70%)",
        }}
      />
      <div className="relative flex max-w-[672px] flex-col items-center gap-4">
        <h1 className="font-display text-[clamp(56px,10vw,72px)] uppercase tracking-wide text-primary">
          404
        </h1>
        <h2 className="font-display text-[clamp(32px,6vw,48px)] uppercase leading-tight tracking-wide text-on-surface">
          {copy.heading}
        </h2>
      </div>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-6">
        {section === "admin" ? (
          <BackButton label="Quay lại" fallbackHref="/admin" size="lg" />
        ) : (
          <>
            <Link href={localizedPath(locale, "/")} className={buttonVariants("primary", "lg")}>
              {copy.home}
            </Link>
            <Link href={localizedPath(locale, "/blog")} className={buttonVariants("secondary", "lg")}>
              {copy.browse}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
