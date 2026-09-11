"use client";

import { useSyncExternalStore, useState, useEffect, type ReactNode } from "react";
import { AgeVerificationGate } from "@/components/ui/AgeVerificationGate";

const STORAGE_KEY = "otter_age_verified";
const COOKIE_NAME = "otter_age_verified";

interface AgeGateWrapperProps {
  children: ReactNode;
  locale: string;
  isVerifiedInitial?: boolean;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("otter_age_verified_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("otter_age_verified_change", callback);
  };
}

function getClientSnapshot(): boolean {
  try {
    const hasLocalStorage = localStorage.getItem(STORAGE_KEY) === "true";
    const hasCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith(`${COOKIE_NAME}=true`));

    return hasLocalStorage || hasCookie;
  } catch {
    return false;
  }
}

function getServerSnapshot(initial: boolean): boolean {
  return initial;
}

/**
 * Puts the age gate in front of the marketing site.
 *
 * This used to `return <AgeVerificationGate />` INSTEAD of `children` when
 * unverified. Because the server snapshot is always "unverified", that meant
 * the server-rendered HTML of every marketing page was the gate and nothing
 * else — around 7KB of "ARE YOU 18+?" where the page should be. No hero, no
 * products, no FAQ, no footer, and no <script type="application/ld+json">
 * either: the structured data only ever existed inside the RSC flight payload,
 * which no crawler reads as content. Every page on the site was effectively
 * blank to Google and to every answer engine.
 *
 * So the gate is now an overlay: `children` always render, and the prompt sits
 * on top of them until the visitor confirms. This is the pattern the large
 * drinks brands use, and it is not cloaking — the content served to a crawler
 * is exactly the content a visitor gets once they confirm. The gate still
 * blocks reading and interaction: the overlay is opaque and full-screen, the
 * page behind it is `inert` (so it takes no clicks and no keyboard focus), and
 * body scrolling is locked while it is up.
 */
export function AgeGateWrapper({ children, locale, isVerifiedInitial = false }: AgeGateWrapperProps) {
  const isVerifiedExternal = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => getServerSnapshot(isVerifiedInitial)
  );

  // Local state for immediate React-level unlock before storage event fires
  const [localVerified, setLocalVerified] = useState(false);

  const isVerified = isVerifiedExternal || localVerified;

  // Lock body scrolling while the gate is up, so the page underneath cannot be
  // scrolled past the overlay on touch devices.
  useEffect(() => {
    if (isVerified) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isVerified]);

  return (
    <>
      {/* `inert` removes the whole subtree from the tab order, from the
          accessibility tree and from pointer events — the keyboard equivalent
          of the opaque overlay covering it. */}
      <div inert={!isVerified}>{children}</div>

      {!isVerified && (
        <AgeVerificationGate
          locale={locale}
          isStandalone={true}
          layout="overlay"
          onVerified={() => {
            setLocalVerified(true);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("otter_age_verified_change"));
            }
          }}
        />
      )}
    </>
  );
}
