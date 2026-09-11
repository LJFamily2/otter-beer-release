"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE } from "@/config/locales";

interface AgeVerificationGateProps {
  locale?: string;
  /**
   * `true` = the parent owns the verified/unverified decision and this
   * component just renders the prompt; `false` = it checks storage itself.
   */
  isStandalone?: boolean;
  /**
   * How the gate occupies the page.
   *
   * - `"page"` (default): a full-height block that IS the page — used by the
   *   standalone /age-verification route.
   * - `"overlay"`: fixed on top of the page, which keeps the real page content
   *   in the DOM underneath. `AgeGateWrapper` uses this so the marketing site
   *   still server-renders its content for crawlers instead of replacing every
   *   page with the gate.
   */
  layout?: "page" | "overlay";
  onVerified?: () => void;
}

const STORAGE_KEY = "otter_age_verified";
const COOKIE_NAME = "otter_age_verified";

const COPY = {
  vi: {
    heading: "BẠN ĐÃ ĐỦ 18 TUỔI CHƯA?",
    yesButton: "Xác nhận đủ 18 tuổi",
    noButton: "Chưa đủ",
    responsibleDrinking: "SỬ DỤNG RƯỢU BIA CÓ TRÁCH NHIỆM",
    address:
      "BADENBEER Co., Ltd. — 13 nhà, Hẻm 30, Đường Lạc Long Quân, Phường Hiệp Định, Tỉnh Tây Ninh",
    deniedHeading: "TRUY CẬP BỊ HẠN CHẾ",
    deniedMessage:
      "Bạn phải đủ 18 tuổi trở lên để truy cập Otter Beer. Chúng tôi khuyến khích sử dụng rượu bia có trách nhiệm.",
    learnMore: "TÌM HIỂU THÊM",
    retry: "Tôi đã chọn nhầm (xác minh lại)",
  },
  en: {
    heading: "ARE YOU 18+?",
    yesButton: "Yes, I'm over 18",
    noButton: "No, I'm underage",
    responsibleDrinking: "Please drink responsibly",
    address:
      "BADENBEER Co., Ltd. — 13 House, Alley 30, Lac Long Quan Street, Hiep Dinh Ward, Tay Ninh Province",
    deniedHeading: "ACCESS RESTRICTED",
    deniedMessage:
      "You must be 18 years of age or older to enter Otter Beer. We promote and support responsible drinking.",
    learnMore: "LEARN MORE",
    retry: "I made a mistake (re-verify)",
  },
} as const;

export function AgeVerificationGate({
  locale = DEFAULT_LOCALE,
  isStandalone = false,
  layout = isStandalone ? "page" : "overlay",
  onVerified,
}: AgeVerificationGateProps) {
  const router = useRouter();
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const content = COPY[locale as keyof typeof COPY] ?? COPY.vi;

  const [isVerified, setIsVerified] = useState<boolean | null>(() =>
    isStandalone ? false : null
  );
  const [isDenied, setIsDenied] = useState(false);

  /**
   * As a full page, the prompt IS the page's heading. As an overlay it sits on
   * top of a page that already has its own h1, so it drops to h2 — two h1s
   * leave a crawler no single statement of what the page is about, and the
   * gate's "ARE YOU 18+?" is emphatically not the answer for the homepage.
   * `aria-labelledby` on the dialog keeps naming it either way.
   */
  const Heading = layout === "page" ? "h1" : "h2";

  useEffect(() => {
    if (isStandalone) {
      return;
    }

    const checkVerification = () => {
      try {
        const hasLocalStorage = localStorage.getItem(STORAGE_KEY) === "true";
        const hasCookie = document.cookie
          .split("; ")
          .some((row) => row.startsWith(`${COOKIE_NAME}=true`));

        setIsVerified(hasLocalStorage || hasCookie);
      } catch {
        setIsVerified(false);
      }
    };

    checkVerification();
  }, [isStandalone]);

  const handleConfirmAge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      document.cookie = `${COOKIE_NAME}=true; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      // Ignore storage errors in restricted contexts
    }

    setIsVerified(true);
    if (onVerified) {
      onVerified();
    }

    if (isStandalone) {
      router.push(prefix || "/");
    }
  };

  const handleDenyAge = () => {
    setIsDenied(true);
  };

  const handleReset = () => {
    setIsDenied(false);
  };

  if (isVerified === true && !isStandalone) {
    return null;
  }

  if (isVerified === null && !isStandalone) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verification-heading"
      className={
        layout === "overlay"
          ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#1B3D84] sm:grid sm:grid-rows-2"
          : "relative flex min-h-dvh w-full flex-col overflow-hidden sm:grid sm:grid-rows-2"
      }
    >
      {/* Background Photo */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none" aria-hidden>
        <Image
          src="/images/age-verification-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />
        {/* Tint so white text stays readable regardless of what's behind it */}
        <div className="absolute inset-0 bg-black/50" aria-hidden />
      </div>

      {/* Top spacer — collapses on mobile so content centers full-height,
          appears at sm+ to push content into the bottom half */}
      <div className="relative z-10 hidden sm:block sm:flex-1" aria-hidden />

      {/* Main Content Block */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:flex-none sm:py-0">
        <div className="flex w-full max-w-2xl flex-col items-center">
          {!isDenied ? (
            <>
              {/* Age Question */}
              <Heading
                id="age-verification-heading"
                className="font-display text-6xl uppercase leading-tight tracking-wide !text-white"
              >
                {content.heading}
              </Heading>

              {/* Buttons Row */}
              <div className="mt-6 flex flex-row flex-wrap justify-center gap-3 lg:mt-8">
                {/* YES Button */}
                <button
                  type="button"
                  onClick={handleConfirmAge}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-white bg-white px-6 py-3 font-sans text-sm font-bold tracking-wider text-black shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)] active:translate-y-0 active:scale-95 sm:px-8 sm:py-3.5 sm:text-base"
                >
                  {content.yesButton}
                </button>

                {/* NO Button */}
                <button
                  type="button"
                  onClick={handleDenyAge}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-white bg-white px-6 py-3 font-sans text-sm font-bold tracking-wider text-black shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)] active:translate-y-0 active:scale-95 sm:px-8 sm:py-3.5 sm:text-base"
                >
                  {content.noButton}
                </button>
              </div>

              {/* Footer text */}
              <p className="mt-6 text-base font-bold uppercase tracking-[0.15em] text-white sm:mt-8">
                {content.responsibleDrinking}
              </p>
              <p className="mt-1.5 max-w-md text-sm font-medium text-white/60">
                {content.address}
              </p>
            </>
          ) : (
            /* Underage Denial View */
            <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center duration-200">
              <Heading
                id="age-verification-heading"
                className="font-display text-6xl uppercase leading-tight tracking-wide !text-white"
              >
                {content.deniedHeading}
              </Heading>
              <p className="mt-3 max-w-md text-base font-medium text-white/70">
                {content.deniedMessage}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-6">
                <a
                  href="https://www.responsibility.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border-2 border-white bg-white px-6 py-3 font-sans text-sm font-bold tracking-wider text-black shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)] active:translate-y-0 active:scale-95 sm:px-8 sm:py-3.5 sm:text-base"
                >
                  {content.learnMore}
                </a>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="group mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50 transition-all duration-200 hover:text-white/90"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform duration-500 group-hover:-rotate-180"
                >
                  <path
                    d="M4 12a8 8 0 0 1 14.5-4.5M20 12a8 8 0 0 1-14.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 3v4.5H14M5.5 21v-4.5H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="underline-offset-4 group-hover:underline">
                  {content.retry}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}