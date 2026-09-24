"use client";

import Link from "next/link";
import { DEFAULT_LOCALE } from "@/config/locales";
import { LEGAL_NAME, SOCIAL_PROFILES } from "@/config/brand";

const [FACEBOOK_URL, INSTAGRAM_URL] = SOCIAL_PROFILES;

interface FooterProps {
  locale?: string;
}

const COPY = {
  vi: {
    navLabel: "Điều hướng chân trang",
    ourStory: "CÂU CHUYỆN",
    shop: "SẢN PHẨM",
    news: "TIN TỨC",
    contactNav: "LIÊN HỆ",
    copyright: `© 2024 - 2026 CÔNG TY TNHH BADENBEER. NẤU BẰNG NIỀM ĐAM MÊ.`,
    legalLabel: "Liên kết pháp lý và liên hệ",
    privacyPolicy: "CHÍNH SÁCH BẢO MẬT",
    termsOfService: "ĐIỀU KHOẢN DỊCH VỤ",
    cookieSettings: "CÀI ĐẶT COOKIE",
    wholesale: "PHÂN PHỐI SỈ",
    contact: "LIÊN HỆ",
  },
  en: {
    navLabel: "Footer Navigation",
    ourStory: "OUR STORY",
    shop: "SHOP",
    news: "NEWS",
    contactNav: "CONTACT",
    copyright: `© 2024 - 2026 ${LEGAL_NAME}. BREWED WITH PASSION.`,
    legalLabel: "Legal and Contact Links",
    privacyPolicy: "PRIVACY POLICY",
    termsOfService: "TERMS OF SERVICE",
    cookieSettings: "COOKIE PREFERENCES",
    wholesale: "WHOLESALE",
    contact: "CONTACT",
  },
} as const;

export function Footer({ locale = DEFAULT_LOCALE }: FooterProps) {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const homePrefix = prefix || "/";
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;

  return (
    <footer className="relative w-full overflow-hidden bg-background text-primary">
      {/* Subtle brand texture, same decorative pattern used on the privacy page */}
      <div className="heritage-pattern pointer-events-none absolute inset-0 z-0" />

      {/* Footer Content */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
        {/* Top Navigation & Action Row */}
        <div className="flex flex-col items-center gap-8 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6">
          {/* Left spacer for balance on desktop */}
          <div className="hidden md:block" aria-hidden="true" />

          {/* Center Main Nav Links */}
          <nav
            aria-label={copy.navLabel}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12 lg:gap-16"
          >
            <Link
              href={`${homePrefix}#story`}
              className="font-display text-2xl tracking-wide text-primary transition-colors duration-200 hover:text-primary-container sm:text-3xl lg:text-4xl"
            >
              {copy.ourStory}
            </Link>
            <Link
              href={`${homePrefix}#products`}
              className="font-display text-2xl tracking-wide text-primary transition-colors duration-200 hover:text-primary-container sm:text-3xl lg:text-4xl"
            >
              {copy.shop}
            </Link>
            <Link
              href={`${prefix}/blog`}
              className="font-display text-2xl tracking-wide text-primary transition-colors duration-200 hover:text-primary-container sm:text-3xl lg:text-4xl"
            >
              {copy.news}
            </Link>
            <Link
              href={`${prefix}/contact`}
              className="font-display text-2xl tracking-wide text-primary transition-colors duration-200 hover:text-primary-container sm:text-3xl lg:text-4xl"
            >
              {copy.contactNav}
            </Link>
          </nav>

          {/* Right Social Icons (Facebook & Instagram) */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 md:justify-end">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary-container active:scale-95"
            >
              <FacebookIcon className="h-6 w-6" />
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary-container active:scale-95"
            >
              <InstagramIcon className="h-6 w-6" />
            </a>
          </div>
        </div>

        {/* Divider Line */}
        <div className="my-7 h-[1px] w-full bg-primary/20 sm:my-8" />

        {/* Bottom Legal & Secondary Links */}
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          {/* Copyright Notice */}
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-primary/90 sm:text-xs">
            {copy.copyright}
          </p>

          {/* Secondary Utility Links */}
          <nav
            aria-label={copy.legalLabel}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8"
          >
            <Link
              href={`${prefix}/privacy`}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors duration-200 hover:text-primary-container hover:underline hover:underline-offset-4 sm:text-xs"
            >
              {copy.privacyPolicy}
            </Link>
            <Link
              href={`${prefix}/terms`}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors duration-200 hover:text-primary-container hover:underline hover:underline-offset-4 sm:text-xs"
            >
              {copy.termsOfService}
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("otter-open-cookie-settings"));
                }
              }}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors duration-200 hover:text-primary-container hover:underline hover:underline-offset-4 sm:text-xs cursor-pointer"
            >
              {copy.cookieSettings}
            </button>
            <Link
              href={`${prefix}/contact`}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors duration-200 hover:text-primary-container hover:underline hover:underline-offset-4 sm:text-xs"
            >
              {copy.wholesale}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────

function FacebookIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
