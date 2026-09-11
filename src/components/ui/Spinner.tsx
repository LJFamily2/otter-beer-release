export type SpinnerVariant = "hop" | "pour" | "ripple";

/**
 * Loading indicator — 3 visual treatments, all built on Tailwind's built-in
 * animate-spin/animate-ping utilities (no extra dependency).
 * AI agents: customize via props (variant, label), not by editing this
 * file's markup — add a new SpinnerVariant if an existing one doesn't fit.
 * See docs/component-library.md for the full prop reference.
 */
export function Spinner({
  variant = "hop",
  label,
  className = "",
}: {
  variant?: SpinnerVariant;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {variant === "hop" ? (
        <span className="flex size-12 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent" />
      ) : variant === "pour" ? (
        <span className="h-16 w-8 animate-pulse rounded-b border-2 border-primary" />
      ) : (
        <span className="relative flex size-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-xl border-2 border-primary [animation-delay:0ms]" />
          <span className="absolute inset-0 animate-ping rounded-xl border-2 border-primary [animation-delay:400ms]" />
          <span className="absolute inset-2 rounded-xl border-2 border-primary" />
        </span>
      )}
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{label}</span>
      ) : null}
    </div>
  );
}
