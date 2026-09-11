"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_LOCALE } from "@/config/locales";
import { localizedPath } from "@/lib/seo";
import {
  ACCEPT_ALL,
  CONSENT_STORAGE_KEY as STORAGE_KEY,
  ESSENTIAL_ONLY,
  writeStoredConsent,
  type CookiePreferences,
} from "@/lib/analytics/consent";

interface CookieConsentProps {
  locale?: string;
}

/**
 * Essential copy describes what a *visitor* actually stores — the age-gate
 * cookie (otter_age_verified) and this consent record. Sign-in/session cookies
 * only exist for admins behind /admin, so naming "authentication" here read as
 * someone else's concern and confused what the toggle covers.
 */
const COPY = {
  vi: {
    bannerTitle: "Lựa Chọn Riêng Tư Của Bạn",
    bannerBody:
      "Chúng tôi dùng cookie để website hoạt động, ghi nhớ lựa chọn của bạn và tìm hiểu cách khách ghé thăm sử dụng trang. Nhấn “Chấp nhận tất cả” là bạn đồng ý cho chúng tôi dùng cookie. Xem",
    privacyLink: "Chính Sách Bảo Mật",
    bannerBodyTail: "để biết thêm chi tiết.",
    settings: "Tùy Chỉnh",
    reject: "Chỉ Cookie Cần Thiết",
    acceptAll: "Chấp Nhận Tất Cả",
    modalTitle: "Tùy Chọn Cookie",
    close: "Đóng",
    essentialTitle: "Cookie Cần Thiết",
    essentialBody:
      "Ghi nhớ xác nhận độ tuổi và lựa chọn cookie của bạn, để website hoạt động đúng và không hỏi lại mỗi lần bạn quay lại. Không thể tắt các cookie này.",
    alwaysActive: "Luôn Bật",
    analyticsTitle: "Cookie Phân Tích",
    analyticsBody:
      "Giúp chúng tôi biết trang nào được xem nhiều để cải thiện website. Dữ liệu ở dạng tổng hợp, không định danh bạn.",
    marketingTitle: "Cookie Tiếp Thị",
    marketingBody:
      "Dùng để hiển thị thông báo và nội dung phù hợp hơn với bạn.",
    cancel: "Hủy",
    save: "Lưu Tùy Chọn",
  },
  en: {
    bannerTitle: "Your Privacy Choice",
    bannerBody:
      "We use cookies to keep the site working, remember your choices, and understand how visitors use the site. By clicking “Accept All”, you consent to our use of cookies. Read our",
    privacyLink: "Privacy Policy",
    bannerBodyTail: "for details.",
    settings: "Settings",
    reject: "Reject Non-Essential",
    acceptAll: "Accept All",
    modalTitle: "Cookie Preferences",
    close: "Close",
    essentialTitle: "Essential Cookies",
    essentialBody:
      "Remember your age confirmation and your cookie choice, so the site works correctly and doesn't ask again every time you return. These can't be switched off.",
    alwaysActive: "Always Active",
    analyticsTitle: "Analytics Cookies",
    analyticsBody:
      "Help us see which pages get read so we can improve the site. The data is aggregated and does not identify you.",
    marketingTitle: "Marketing Cookies",
    marketingBody:
      "Used to deliver announcements and content that are more relevant to you.",
    cancel: "Cancel",
    save: "Save Preferences",
  },
} as const;

export function CookieConsent({ locale = DEFAULT_LOCALE }: CookieConsentProps) {
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem(STORAGE_KEY);
    if (!savedConsent) {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    }

    const handleOpenSettings = () => {
      setIsOpen(true);
      setShowSettings(true);
    };

    window.addEventListener("otter-open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("otter-open-cookie-settings", handleOpenSettings);
    };
  }, []);

  // Each of these persists AND pushes a Consent Mode v2 `update` — see
  // writeStoredConsent. Previously they only wrote to localStorage, so
  // "Only essential cookies" dismissed the banner and changed nothing about
  // what Google Analytics was allowed to do.
  const handleAcceptAll = () => {
    writeStoredConsent(ACCEPT_ALL);
    setIsOpen(false);
  };

  const handleRejectNonEssential = () => {
    writeStoredConsent(ESSENTIAL_ONLY);
    setIsOpen(false);
  };

  const handleSavePreferences = () => {
    writeStoredConsent({ ...preferences, essential: true });
    setShowSettings(false);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Bottom Sticky Banner */}
      <div
        role="region"
        aria-label={copy.bannerTitle}
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/30 gold-border-top shadow-md"
      >
        <div className="mx-auto max-w-[1280px] p-5 md:px-16 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2 text-primary">
              <svg
                className="w-6 h-6 fill-current text-primary"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M21.59 11.59a9.98 9.98 0 0 0-8.58-8.58 1 1 0 0 0-1.11 1.11c.14.91-.18 1.83-.83 2.48s-1.57.97-2.48.83a1 1 0 0 0-1.11 1.11c.54 2.87-1.4 5.56-4.32 5.96a1 1 0 0 0-.86 1.14 10 10 0 1 0 19.29-4.05ZM8.5 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3.5-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4.5 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
              </svg>
              <h2 className="font-display text-xl uppercase tracking-wide text-primary">
                {copy.bannerTitle}
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant max-w-4xl leading-relaxed">
              {copy.bannerBody}{" "}
              <Link
                href={localizedPath(locale, "/privacy")}
                className="text-primary underline hover:text-primary-container transition-colors"
              >
                {copy.privacyLink}
              </Link>{" "}
              {copy.bannerBodyTail}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowSettings(true)}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors rounded-sm w-full sm:w-auto text-center"
            >
              {copy.settings}
            </button>
            <button
              onClick={handleRejectNonEssential}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant border border-outline-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors rounded-sm w-full sm:w-auto text-center"
            >
              {copy.reject}
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors rounded-sm w-full sm:w-auto text-center"
            >
              {copy.acceptAll}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-sm p-6 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-surface-variant pb-4">
              <h3
                id="cookie-preferences-title"
                className="font-display text-2xl uppercase text-primary"
              >
                {copy.modalTitle}
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors p-1"
                aria-label={copy.close}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-3 bg-surface-container-low rounded-sm">
                <div>
                  <h4 className="font-bold text-sm text-on-surface uppercase">
                    {copy.essentialTitle}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {copy.essentialBody}
                  </p>
                </div>
                <span className="text-xs font-mono uppercase bg-primary/10 text-primary px-2 py-1 rounded-xs whitespace-nowrap">
                  {copy.alwaysActive}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 border border-outline-variant/40 rounded-sm">
                <div>
                  <h4 className="font-bold text-sm text-on-surface uppercase">
                    {copy.analyticsTitle}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {copy.analyticsBody}
                  </p>
                </div>
                <input
                  type="checkbox"
                  aria-label={copy.analyticsTitle}
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded-xs border-outline accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3 border border-outline-variant/40 rounded-sm">
                <div>
                  <h4 className="font-bold text-sm text-on-surface uppercase">
                    {copy.marketingTitle}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {copy.marketingBody}
                  </p>
                </div>
                <input
                  type="checkbox"
                  aria-label={copy.marketingTitle}
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      marketing: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded-xs border-outline accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-surface-variant pt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant border border-outline-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors rounded-sm"
              >
                {copy.cancel}
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors rounded-sm"
              >
                {copy.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
