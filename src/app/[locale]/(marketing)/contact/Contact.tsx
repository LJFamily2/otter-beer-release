"use client";

import { useState, useCallback } from "react";
import { MAP_URL, formatGeo } from "@/config/brand";

interface ContactSectionProps {
  locale?: string;
  /**
   * Which heading tag the section title renders as. Defaults to `h1` for the
   * standalone /contact page; the homepage embeds this same section and passes
   * `h2`, because the page's one h1 belongs to the hero.
   */
  headingLevel?: "h1" | "h2";
}

const COPY = {
  en: {
    kicker: "CONTACT & LOCATION",
    headingLine1: "Crafted In",
    headingLine2: "Tay Ninh",
    body: "Whether you're inquiring about private events, wholesale distribution, or simply want to know what's pouring, call us directly or visit our brewery.",
    call: "Call Us",
    message: "Send Email",
    copied: "Copied!",
    toastMessage: "Email copied: hello@otterbeer.vn",
    phoneLabel: "PHONE NUMBERS",
    taproomLabel: "THE TAPROOM & BREWERY",
    address:
      "13 House, Alley 30, Lac Long Quan Street, Hiep Dinh Ward, Tay Ninh Province",
    directions: "Get Directions",
    factory: "Visit Factory",
    statusOpen: "Taproom Open",
  },
  vi: {
    kicker: "LIÊN HỆ & ĐỊA CHỈ",
    headingLine1: "ĐẬM CHẤT",
    headingLine2: "TÂY NINH",
    body: "Đặt bia cho sự kiện, hợp tác phân phối sỉ, hay ghé thăm xưởng bia thưởng thức mẻ bia mới. Hãy gọi trực tiếp hoặc ghé qua xưởng bia.",
    call: "Gọi Ngay",
    message: "Gửi Email",
    copied: "Đã sao chép!",
    toastMessage: "Đã sao chép email: hello@otterbeer.vn",
    phoneLabel: "SỐ ĐIỆN THOẠI",
    taproomLabel: "TAPROOM & NHÀ MÁY",
    address:
      "Số nhà 13, hẻm 30, đường Lạc Long Quân, phường Hiệp Định, tỉnh Tây Ninh",
    directions: "Chỉ Đường",
    factory: "Tham Quan Nhà Máy",
    statusOpen: "Xưởng Bia Đang Mở Cửa",
  },
} as const;

function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-[16px] w-[16px] text-[#fed65b]"
    >
      <path
        d="M2.5 4.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m3 5.5 7 5.5 7-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-[15px] w-[15px] text-[#f9e37a]"
    >
      <path
        d="M8 1.2A5.6 5.6 0 0 0 2.4 6.8c0 4.1 4.2 7.7 5.2 8.6.2.2.5.2.7 0 .9-.9 5.3-4.5 5.3-8.6A5.6 5.6 0 0 0 8 1.2Zm0 7.6A2 2 0 1 1 8 5a2 2 0 0 1 0 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

function GpsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 text-[#f9e37a]"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ContactSection({
  locale = "en",
  headingLevel = "h1",
}: ContactSectionProps) {
  const copy = COPY[locale === "vi" ? "vi" : "en"];
  const Heading = headingLevel;

  const [copied, setCopied] = useState(false);

  const handleCopyEmail = useCallback(async () => {
    const email = "hello@otterbeer.vn";
    let success = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
        success = true;
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = email;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      success = document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (success) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(40);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, []);

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-[#0d0f10] text-white pt-16 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24"
    >
      {/* Dark Ambient Scrim & Radial Glow */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(13,15,16,0.92) 0%, rgba(13,15,16,0.85) 50%, rgba(13,15,16,0.95) 100%), url('/images/contact-hero.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_40%,rgba(254,214,91,0.07),transparent_60%)] pointer-events-none" />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-stretch">
          {/* Left Column: Editorial Stage */}
          <div className="flex flex-col justify-between lg:col-span-6 space-y-10">
            <div>
              {/* Category Kicker Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[0.75rem] font-bold uppercase tracking-[0.2em] text-[#f9e37a] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#fed65b] animate-pulse" />
                <span>{copy.kicker}</span>
              </div>

              {/* Display Headline - Balanced 2-Line Formatting with Zero Overlap */}
              <Heading className="mt-6 !text-white font-display text-[clamp(3rem,4.8vw,5.2rem)] leading-[1.25] tracking-[-0.02em] uppercase">
                <span className="block">{copy.headingLine1}</span>
                <span className="block text-[#fed65b] mt-1.5 sm:mt-2.5">
                  {copy.headingLine2}
                </span>
              </Heading>

              {/* Standfirst Body Copy */}
              <p className="mt-6 max-w-[580px] text-[clamp(1.125rem,1.4vw,1.35rem)] leading-relaxed text-[#d4d4d8] font-light">
                {copy.body}
              </p>

              {/* Action Buttons - Solid Accent Block */}
              <div className="mt-8 flex flex-wrap gap-4 sm:mt-10">
                <a
                  href="tel:+84908790102"
                  className="group inline-flex h-[56px] min-w-[190px] items-center justify-center gap-3 rounded-xl bg-[#fed65b] px-6 text-[1.05rem] font-bold uppercase tracking-wider text-black shadow-lg shadow-[#fed65b]/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffe382] hover:shadow-[#fed65b]/20 active:translate-y-0 active:scale-[0.98]"
                >
                  <PhoneIcon className="h-4 w-4 text-black" />
                  <span>{copy.call}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label={copied ? copy.copied : copy.message}
                  className={`group inline-flex h-[56px] min-w-[190px] items-center justify-center gap-2.5 rounded-xl border px-6 text-[1.05rem] font-semibold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
                    copied
                      ? "border-[#10b981]/50 bg-[#064e3b]/40 text-[#34d399]"
                      : "border-[#fed65b]/30 bg-[#221e14] text-[#fed65b] hover:border-[#fed65b] hover:bg-[#2e291c]"
                  }`}
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-[#34d399]" />
                  ) : (
                    <EmailIcon />
                  )}
                  <span>{copied ? copy.copied : copy.message}</span>
                </button>
              </div>
            </div>

            {/* Information Cards Grid */}
            <div className="grid grid-cols-1 gap-5 border-t border-white/10 pt-8 sm:grid-cols-2">
              {/* Phone Numbers Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-colors hover:border-white/20">
                <div className="flex items-center gap-2.5 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-[#f9e37a]">
                  <PhoneIcon className="h-4 w-4 text-[#f9e37a]" />
                  <span>{copy.phoneLabel}</span>
                </div>
                <div className="mt-3 space-y-1 text-[1.25rem] font-light tracking-wide text-white">
                  <p>
                    <a
                      href="tel:+84908790102"
                      className="transition-colors hover:text-[#f9e37a]"
                    >
                      (+84) 908 790 102
                    </a>
                  </p>
                  <p>
                    <a
                      href="tel:+84981686491"
                      className="transition-colors hover:text-[#f9e37a]"
                    >
                      (+84) 981 686 491
                    </a>
                  </p>
                </div>
              </div>

              {/* Taproom Address & GPS Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-colors hover:border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-[#f9e37a]">
                    <LocationIcon />
                    <span>{copy.taproomLabel}</span>
                  </div>
                </div>
                <address className="mt-3 text-[0.9375rem] not-italic leading-relaxed text-[#a1a1aa]">
                  {copy.address}
                </address>

                {/* GPS badge — rendered from brand.ts GEO, the same value the
                    Brewery JSON-LD publishes, so the two can never drift. */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1 text-[0.75rem] font-mono text-[#f9e37a]/90">
                    <GpsIcon />
                    <span>{formatGeo(locale)}</span>
                  </span>

                  {/* The "Get Directions" copy existed in COPY and MAP_URL
                      existed in brand.ts, but nothing ever rendered either —
                      the address was a dead end for anyone trying to visit. */}
                  <a
                    href={MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="contact-directions"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#fed65b]/30 px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-[#fed65b] transition-colors hover:border-[#fed65b] hover:bg-[#fed65b]/10"
                  >
                    <DirectionsIcon />
                    <span>{copy.directions}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Immersive Full-Height Clean Google Map Viewport */}
          <div className="relative min-h-[480px] sm:min-h-[580px] lg:min-h-[660px] lg:col-span-6 w-full overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-2xl">
            {/* Embedded Google Map Iframe */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m11!1m3!1d754.2940271989668!2d106.114369305785!3d11.338500797602256!2m2!1f0!2f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310b6b0000a1904d%3A0xe450c57b7112df8d!2sTay%20Ninh%20Otter%20Beer%20Brewery!5e1!3m2!1sen!2s!4v1787824329313!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title={
                locale === "vi"
                  ? "Bản đồ Nhà máy bia Tây Ninh Otter Beer"
                  : "Tay Ninh Otter Beer Brewery Map"
              }
              className="h-full w-full border-0 filter contrast-[105%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
