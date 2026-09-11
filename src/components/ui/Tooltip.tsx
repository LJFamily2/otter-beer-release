import type { ReactNode } from "react";

/**
 * CSS-only hover tooltip (no JS, works with keyboard focus via :focus-within).
 * AI agents: customize via props (label, side, children), not by editing
 * this file's markup. See docs/component-library.md for the full prop
 * reference.
 */
export function Tooltip({
  label,
  side = "top",
  children,
  className = "",
}: {
  label: string;
  side?: "top" | "bottom";
  children: ReactNode;
  className?: string;
}) {
  const positionClass =
    side === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "top-full left-1/2 mt-2 -translate-x-1/2";

  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-10 whitespace-nowrap rounded bg-inverse-surface px-2.5 py-1.5 text-xs text-inverse-on-surface opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${positionClass}`}
      >
        {label}
      </span>
    </span>
  );
}
