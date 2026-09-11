"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SOCIAL_PROFILES } from "@/config/brand";

const [FACEBOOK_URL, INSTAGRAM_URL] = SOCIAL_PROFILES;

/** Keyed by the header's own VIE/ENG display codes (see `locale`/`locales` props). */
const CONTACT_LABEL: Record<string, string> = {
  VIE: "Liên hệ",
  ENG: "Contact",
};

interface HeaderLink {
  label: string;
  href: string;
}

interface HeaderProps {
  links?: HeaderLink[];
  contactHref?: string;
  locale?: string;
  locales?: string[];
  onLanguageChange?: (language: string) => void;
}

/**
 * Marketing site header with centered logo, navigation links,
 * social icons, language selector, and contact button.
 * Mobile: OTTER BEER title, language selector, and menu dropdown
 * where the menu button and close X occupy the EXACT same on-screen position.
 */
export function Header({
  links = [
    { label: "Sản phẩm", href: "#products" },
    { label: "Câu chuyện", href: "#story" },
    { label: "Tin tức", href: "/blog" },
  ],
  contactHref = "#contact",
  locale = "VIE",
  locales = ["VIE", "ENG"],
  onLanguageChange,
}: HeaderProps) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 10);
      
      // Hide when scrolling down (if past the top), show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100 && !mobileMenuOpen && !languageOpen) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setIsHidden(false);
      }
      
      lastScrollY = currentScrollY;
    };

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen, languageOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  const contactLabel = CONTACT_LABEL[locale] ?? "Contact";
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.dataset.mobileMenuOpen = "true";
    } else {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileMenuOpen;
    }
    window.dispatchEvent(
      new CustomEvent("mobile-menu-toggle", { detail: { isOpen: mobileMenuOpen } })
    );
    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileMenuOpen;
    };
  }, [mobileMenuOpen]);

  const handleLanguageSelect = (lang: string) => {
    setLanguageOpen(false);
    onLanguageChange?.(lang);

    const isEnglish = lang === "ENG";
    const pathWithoutLocale =
      (pathname || "/").replace(/^\/en(?=\/|$)/, "") || "/";
    const nextPath = isEnglish
      ? `/en${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`
      : pathWithoutLocale;

    if (nextPath !== pathname) {
      router.push(
        `${nextPath}${window.location.search}${window.location.hash}`,
        { scroll: false },
      );
    }
  };

  return (
    <>
      <header
        className={`relative z-50 w-full transition-all duration-300 ${
          mobileMenuOpen
            ? "h-[64px] sm:h-[108px] bg-transparent"
            : isScrolled
            ? "h-[68px] sm:h-[84px] bg-white/95 backdrop-blur-md shadow-sm"
            : "h-[90px] sm:h-[108px] bg-gradient-to-b from-black/50 via-black/15 to-transparent"
        } ${isHidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6 sm:px-10 lg:px-16">
          {/* Left Navigation Links (Desktop only) */}
          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-8 lg:gap-12 max-[900px]:hidden"
          >
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`group relative text-[15px] lg:text-[16px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
                  mobileMenuOpen || !isScrolled
                    ? "text-white hover:text-secondary-fixed drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                    : "text-primary hover:text-primary-container"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 ${
                    mobileMenuOpen || !isScrolled ? "bg-white" : "bg-primary"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Mobile Title (OTTER BEER brand title) */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Otter Beer"
            className="flex shrink-0 flex-col items-start justify-center group transition-opacity hover:opacity-90 min-[900px]:hidden z-10"
          >
            {/* `whitespace-nowrap` is load-bearing: "OTTER BEER" is two words in
                a flex row that also carries the language selector and the menu
                button. At ~360px the wide 0.18em tracking leaves only ~15px of
                slack, so anything narrower (a 320px phone, or a larger system
                font) pushed "BEER" onto a second line. The tracking/size steps
                below buy that space back on the narrowest screens rather than
                letting the title overflow the header instead of wrapping. */}
            <span
              className={`font-black text-2xl sm:text-3xl uppercase tracking-[0.18em] whitespace-nowrap max-[380px]:tracking-[0.1em] max-[340px]:text-xl transition-colors duration-300 leading-none ${
                mobileMenuOpen || !isScrolled
                  ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  : "text-primary"
              }`}
            >
              OTTER BEER
            </span>
            {mobileMenuOpen && (
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] mt-1">
                EST. 2024 • CRAFT BREWERY
              </span>
            )}
          </Link>

          {/* Centered Logo Image (Desktop view only) */}
          <Link
            href="/"
            aria-label="Otter Beer"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-105 hidden min-[900px]:block"
          >
            <div
              className={`relative transition-all duration-300 ${
                isScrolled
                  ? "h-[60px] w-[100px] sm:h-[72px] sm:w-[120px]"
                  : "h-[82px] w-[136px] sm:h-[108px] sm:w-[180px]"
              }`}
            >
              <Image
                src="/images/header/logo.png"
                alt="Otter Beer Logo"
                fill
                sizes="(max-width: 640px) 180px, 250px"
                className="object-contain"
                priority
              />
            </div>
            <span className="sr-only">Otter Beer</span>
          </Link>

          {/* Right-side group: Social icons, Language selector, Contact button, Mobile Menu button */}
          <div className="ml-auto flex items-center gap-3 sm:gap-4 z-10">
            {/* Social Icon - Facebook (Desktop only) */}
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="me noopener noreferrer"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 max-[900px]:hidden ${
                mobileMenuOpen || !isScrolled
                  ? "text-white hover:bg-white/20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  : "text-primary hover:bg-primary/10 hover:text-primary-container"
              }`}
              aria-label="Facebook"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>

            {/* Social Icon - Instagram (Desktop only) */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="me noopener noreferrer"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 max-[900px]:hidden ${
                mobileMenuOpen || !isScrolled
                  ? "text-white hover:bg-white/20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  : "text-primary hover:bg-primary/10 hover:text-primary-container"
              }`}
              aria-label="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>

            {/* Language Selector Dropdown (Desktop & Mobile when menu closed) */}
            <div
              className={`relative ${mobileMenuOpen ? "max-[900px]:hidden" : ""}`}
              ref={languageRef}
            >
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className={`group relative flex h-9 items-center justify-center gap-1.5 px-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 ${
                  mobileMenuOpen || !isScrolled
                    ? "text-white hover:text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                    : "text-primary hover:text-primary-container"
                }`}
                aria-label="Select language"
                aria-expanded={languageOpen}
              >
                <span>{locale}</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    languageOpen ? "rotate-180 text-amber-500" : ""
                  }`}
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Subtle golden underline indicator when open */}
                <span
                  className={`absolute -bottom-1 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ${
                    languageOpen
                      ? "bg-amber-400 opacity-100 scale-x-100"
                      : "bg-transparent opacity-0 scale-x-0 group-hover:bg-amber-400/50 group-hover:opacity-100 group-hover:scale-x-75"
                  }`}
                />
              </button>

              {/* Luxury Light Editorial Language Dropdown Menu */}
              {languageOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-48 overflow-hidden rounded-2xl border border-amber-900/10 bg-gradient-to-b from-slate-50/98 to-amber-50/95 p-1.5 shadow-2xl shadow-zinc-900/15 backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 z-50">
                  {locales.map((lang) => {
                    const isSelected = lang === locale;
                    return (
                      <button
                        key={lang}
                        onClick={() => handleLanguageSelect(lang)}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "bg-amber-500/15 text-amber-950 font-extrabold shadow-sm"
                            : "text-zinc-700 hover:bg-white/80 hover:text-zinc-950"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && (
                            <svg
                              className="h-3.5 w-3.5 text-amber-700"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M13.5 4.5L6.5 11.5L3 8"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          <span>{lang === "VIE" ? "Tiếng Việt" : "English"}</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-900"
                              : "bg-zinc-200/60 text-zinc-500"
                          }`}
                        >
                          {lang}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contact Button (Desktop only) */}
            <Link
              href={contactHref}
              className={`flex h-9 sm:h-10 items-center justify-center rounded-full px-4 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-[0.1em] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] max-[900px]:hidden ${
                mobileMenuOpen || !isScrolled
                  ? "bg-white/90 text-primary shadow-md backdrop-blur-sm hover:bg-white hover:text-primary-container"
                  : "bg-primary text-on-primary shadow-sm hover:bg-primary-container hover:shadow-md"
              }`}
            >
              {contactLabel}
            </Link>

            {/* Luxury Editorial Circular Menu Button - Single source of truth button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 min-[900px]:hidden ${
                mobileMenuOpen || !isScrolled
                  ? "text-white hover:bg-white/20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  : "text-primary hover:bg-primary/10"
              }`}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <CloseCircleIcon className="h-8 w-8" />
              ) : (
                <EditorialCircleMenuIcon className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Craft Brewery Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-between bg-[#0f0e0c]/98 pt-[80px] sm:pt-[100px] pb-8 px-6 sm:px-10 backdrop-blur-2xl transition-all duration-300 min-[900px]:hidden text-white border-l border-amber-500/20 shadow-2xl">
          {/* Drawer Main Craft Navigation */}
          <nav className="my-auto flex flex-col items-start gap-6 py-4 w-full">
            {links.map((link, idx) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="group flex items-baseline gap-4 transition-transform hover:translate-x-2"
              >
                <span className="text-xs font-mono font-bold text-amber-500/80">
                  0{idx + 1}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.15em] text-white/90 transition-colors group-hover:text-amber-400">
                  {link.label}
                </span>
              </Link>
            ))}

            <Link
              href={contactHref}
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-sm font-extrabold uppercase tracking-[0.15em] shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-95"
            >
              {contactLabel}
            </Link>
          </nav>

          {/* Drawer Footer: Equal Spanning Language Switcher */}
          <div className="border-t border-amber-500/20 pt-6 w-full">
            <div className="grid grid-cols-2 gap-3 w-full">
              {locales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    handleLanguageSelect(lang);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex h-11 items-center justify-center rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all w-full text-center px-4 ${
                    lang === locale
                      ? "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20"
                      : "bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {lang === "VIE" ? "Tiếng Việt" : "English"} ({lang})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── SVG Vector Icons ──────────────────────────────────────────────────────

/** Luxury Editorial Circular 3-Line Menu Icon (Pizza 4P's reference style) */
function EditorialCircleMenuIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-60"
      />
      <line
        x1="12"
        y1="15"
        x2="28"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="20"
        x2="28"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="25"
        x2="28"
        y2="25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseCircleIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-60"
      />
      <path
        d="M14 14L26 26M26 14L14 26"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
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

function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
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
