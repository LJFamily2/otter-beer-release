import type { TextareaHTMLAttributes, ReactNode } from "react";

/**
 * Multi-line text input — label + optional error state.
 * AI agents: customize via props (label, error, hint, rows, ...rest native
 * textarea attributes), not by editing this file's markup. See
 * docs/component-library.md for the full prop reference.
 */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  rows = 5,
  className = "",
  wrapperClassName = "",
  ...props
}: TextareaProps) {
  const textareaId =
    id ?? (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`flex flex-col gap-2 ${wrapperClassName}`}>
      {label ? (
        <label
          htmlFor={textareaId}
          className={`text-sm font-bold tracking-wide ${error ? "text-error" : "text-on-surface"}`}
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full resize-y rounded-sm border bg-surface-container-lowest px-[17px] py-[13px] text-base text-on-surface shadow-sm outline-none transition-colors placeholder:text-outline/60 focus:border-secondary-fixed-dim disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? "border-error bg-error-container/10" : "border-outline-variant"
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}
