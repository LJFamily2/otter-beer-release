import type { ReactNode } from "react";
import { InfoCircleIcon, CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon } from "./icons";

export type AlertVariant = "info" | "success" | "warning" | "error";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: "bg-primary-fixed border-primary-fixed-dim",
  success: "bg-[#e6f4ea] border-[#ceead6]",
  warning: "bg-secondary-fixed border-secondary-fixed-dim",
  error: "bg-error-container border-error/20",
};

const TITLE_CLASSES: Record<AlertVariant, string> = {
  info: "text-on-primary-fixed",
  success: "text-[#137333]",
  warning: "text-on-secondary-fixed",
  error: "text-on-error-container",
};

const DESC_CLASSES: Record<AlertVariant, string> = {
  info: "text-on-primary-fixed-variant",
  success: "text-[#1e8e3e]",
  warning: "text-on-secondary-fixed-variant",
  error: "text-error",
};

const ICONS: Record<AlertVariant, ReactNode> = {
  info: <InfoCircleIcon width={20} height={20} />,
  success: <CheckCircleIcon width={20} height={20} />,
  warning: <AlertTriangleIcon width={22} height={22} />,
  error: <AlertCircleIcon width={20} height={20} />,
};

/**
 * Inline banner for contextual status messages.
 * AI agents: customize via props (variant, title, description, icon), not
 * by editing this file's markup — add a new AlertVariant if an existing one
 * doesn't fit. See docs/component-library.md for the full prop reference.
 */
export function Alert({
  variant,
  title,
  description,
  icon,
  className = "",
}: {
  variant: AlertVariant;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-4 rounded border p-4 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <span className={`mt-0.5 shrink-0 ${TITLE_CLASSES[variant]}`}>{icon ?? ICONS[variant]}</span>
      <div className="flex flex-col gap-1">
        <p className={`text-sm font-bold tracking-wide ${TITLE_CLASSES[variant]}`}>{title}</p>
        {description ? <p className={`text-sm ${DESC_CLASSES[variant]}`}>{description}</p> : null}
      </div>
    </div>
  );
}
