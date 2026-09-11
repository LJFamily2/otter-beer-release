import type { ReactNode } from "react";
import { CheckCircleIcon, CloseIcon } from "./icons";

/**
 * Presentational toast notification (dark pill with icon + message + close).
 * This component is display-only — it does not manage a stacking queue or
 * auto-dismiss timers. Compose it with your own state/positioning wrapper
 * (e.g. a fixed bottom-right stack) rather than editing this file to add
 * queueing behavior.
 * AI agents: customize via props (icon, message, onClose), not by editing
 * this file's markup. See docs/component-library.md for the full prop
 * reference.
 */
export function Toast({
  icon,
  message,
  onClose,
  className = "",
}: {
  icon?: ReactNode;
  message: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex items-center gap-4 rounded bg-inverse-surface p-4 text-inverse-on-surface shadow-md ${className}`}
    >
      <span className="shrink-0 text-[#10b981]">{icon ?? <CheckCircleIcon width={20} height={20} />}</span>
      <p className="text-base">{message}</p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-2 shrink-0 cursor-pointer text-inverse-on-surface/70 hover:text-inverse-on-surface"
        >
          <CloseIcon width={13} height={13} />
        </button>
      ) : null}
    </div>
  );
}
