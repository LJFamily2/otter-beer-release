"use client";

import { useEffect } from "react";
import { getClientLocale } from "@/lib/utils/getClientLocale";
import { buttonVariants } from "@/components/ui/Button";

const COPY = {
  vi: {
    heading: "Vẫn đang lên men...",
    description:
      "Máy chủ của chúng tôi gặp chút sự cố. Chúng tôi đang dọn dẹp và sẽ sớm hoạt động trở lại.",
    retry: "Thử lại",
    contact: "Liên hệ hỗ trợ",
  },
  en: {
    heading: "Still fermenting...",
    description:
      "Our servers are having a bit of a spill. We're mopping up the deck and getting things back shipshape shortly.",
    retry: "Try Again",
    contact: "Contact Support",
  },
} as const;

const SUPPORT_EMAIL = "support@otterbeer.vn";

/**
 * Root-level error boundary (must be a Client Component — see
 * node_modules/next/dist/docs/.../file-conventions/error.md). Wrapped by
 * the bare root layout only (no marketing header/footer or admin shell),
 * matching the Figma design's "navigation shell suppressed" note for
 * error pages. Catches runtime errors thrown by any page below root
 * layout; a failure in the root layout itself would need global-error.tsx
 * instead, which isn't implemented since it can't share this page's fonts
 * without duplicating the font-loading setup from layout.tsx.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // See the matching comment in src/app/not-found.tsx — LocaleCode resolves
  // to plain `string`, so this index needs an assertion; safe since
  // getClientLocale() only ever returns a key of COPY.
  const copy = COPY[getClientLocale() as keyof typeof COPY];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface px-16 py-24 text-center">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-xl bg-surface-container-low opacity-70 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-xl bg-surface-container-lowest opacity-60 blur-[60px]" />
      <div className="relative flex max-w-[672px] flex-col items-center gap-4">
        <h1 className="font-display text-[clamp(56px,10vw,72px)] uppercase tracking-wide text-primary">
          500
        </h1>
        <div className="h-0.5 w-16 bg-secondary" />
        <h2 className="font-display text-[clamp(28px,5vw,48px)] uppercase tracking-wide text-on-primary-fixed">
          {copy.heading}
        </h2>
        <p className="max-w-[512px] text-lg leading-relaxed text-on-surface-variant">
          {copy.description}
        </p>
      </div>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={retry} className={buttonVariants("primary", "lg")}>
          {copy.retry}
        </button>
        <a href={`mailto:${SUPPORT_EMAIL}`} className={buttonVariants("secondary", "lg")}>
          {copy.contact}
        </a>
      </div>
    </div>
  );
}
