import type { ReactNode } from "react";
import { CheckCircleIcon, AlertTriangleIcon } from "./icons";

export type StatusTone = "pending" | "active" | "featured" | "alert";

const TONE_CLASSES: Record<StatusTone, string> = {
  pending: "border border-outline-variant text-on-surface-variant",
  active: "bg-primary text-on-primary shadow-sm",
  featured: "bg-secondary-container text-on-secondary-container shadow-sm",
  alert: "border border-error text-error",
};

const TONE_ICON: Record<StatusTone, ReactNode> = {
  pending: <span className="size-3 rounded-full border-2 border-current" />,
  active: <CheckCircleIcon width={13} height={13} />,
  featured: <CheckCircleIcon width={13} height={13} />,
  alert: <AlertTriangleIcon width={13} height={13} />,
};

/**
 * Pill status indicator with a leading glyph — distinct from Badge, which is
 * plain text-only. Used for workflow/stock/moderation states.
 * AI agents: customize via props (tone, icon, children), not by editing this
 * file's markup — add a new StatusTone if an existing one doesn't fit.
 * See docs/component-library.md for the full prop reference.
 */
export function StatusBadge({
  tone,
  icon,
  children,
  className = "",
}: {
  tone: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {icon ?? TONE_ICON[tone]}
      {children}
    </span>
  );
}

/** Small colored dot used inline before a status label in table cells (e.g. stock status). */
export function StatusDot({
  color,
  className = "",
}: {
  color: "success" | "warning" | "error";
  className?: string;
}) {
  const colorClass =
    color === "success"
      ? "bg-[#10b981]"
      : color === "warning"
        ? "bg-[#f59e0b]"
        : "bg-error";
  return <span className={`inline-block size-2 rounded-full ${colorClass} ${className}`} />;
}
