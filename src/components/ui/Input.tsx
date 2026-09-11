import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Text input — label, optional leading icon, optional error state.
 * AI agents: customize via props (label, icon, error, hint, size, ...rest
 * native input attributes), not by editing this file's markup. See
 * docs/component-library.md for the full prop reference.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Input({
  label,
  icon,
  error,
  hint,
  id,
  className = "",
  wrapperClassName = "",
  ...props
}: InputProps) {
  const inputId =
    id ?? (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`flex flex-col gap-2 ${wrapperClassName}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className={`text-sm font-bold tracking-wide ${error ? "text-error" : "text-on-surface"}`}
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={`w-full rounded-sm border bg-surface-container-lowest px-[17px] py-[13px] text-base text-on-surface shadow-sm outline-none transition-colors placeholder:text-outline/60 focus:border-secondary-fixed-dim disabled:cursor-not-allowed disabled:opacity-60 ${
            icon ? "pl-12" : ""
          } ${error ? "border-error bg-error-container/10" : "border-outline-variant"} ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}
