"use client";

import { useState, useEffect } from "react";
import { DEFAULT_LOCALE } from "@/config/locales";

interface MobileContactBarProps {
  locale?: string;
}

const COPY = {
  vi: { email: "EMAIL", phone: "ĐIỆN THOẠI", zalo: "ZALO" },
  en: { email: "EMAIL", phone: "PHONE", zalo: "ZALO" },
} as const;

export function MobileContactBar({ locale = DEFAULT_LOCALE }: MobileContactBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;

  useEffect(() => {
    const handleScroll = () => {
      // Show the bar only after scrolling down 50px
      setIsScrolled(window.scrollY > 50);
    };

    const handleMenuToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsMenuOpen(Boolean(customEvent.detail?.isOpen));
    };

    handleScroll(); // Check initial scroll position
    if (typeof document !== "undefined" && document.body.dataset.mobileMenuOpen === "true") {
      queueMicrotask(() => setIsMenuOpen(true));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mobile-menu-toggle", handleMenuToggle);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mobile-menu-toggle", handleMenuToggle);
    };
  }, []);

  const isVisible = isScrolled && !isMenuOpen;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 flex h-[56px] w-full border-t border-black/5 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <a
        href="mailto:hello@otterbeer.vn"
        className="flex flex-1 items-center justify-center border-r border-black/5 text-[0.8125rem] font-bold uppercase tracking-wider text-primary transition-colors active:bg-black/5"
      >
        {copy.email}
      </a>
      <a
        href="tel:+84908790102"
        className="flex flex-1 items-center justify-center border-r border-black/5 text-[0.8125rem] font-bold uppercase tracking-wider text-primary transition-colors active:bg-black/5"
      >
        {copy.phone}
      </a>
      <a
        href="https://zalo.me/0908790102"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center text-[0.8125rem] font-bold uppercase tracking-wider text-primary transition-colors active:bg-black/5"
      >
        {copy.zalo}
      </a>
    </div>
  );
}
