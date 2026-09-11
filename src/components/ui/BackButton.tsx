"use client";

import { useRouter } from "next/navigation";
import { buttonVariants, type ButtonVariant, type ButtonSize } from "./Button";

/**
 * Returns to the previous page via browser history, falling back to a
 * fixed destination when there's no history to go back to (e.g. the tab's
 * very first navigation landed directly on this page).
 * AI agents: customize via props (label, fallbackHref, variant, size), not
 * by editing this file's markup. See docs/component-library.md for the
 * full prop reference.
 */
export function BackButton({
  label,
  fallbackHref,
  variant = "primary",
  size = "md",
  className = "",
}: {
  label: string;
  fallbackHref: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${buttonVariants(variant, size)} ${className}`}
    >
      {label}
    </button>
  );
}
