import type { InputHTMLAttributes } from "react";

/**
 * Checkbox — a native <input type="checkbox"> under a styled shell (unlike
 * Select, a checkbox's own popup-free rendering IS stylable via CSS, so no
 * custom listbox-style rebuild is needed here).
 * AI agents: customize via props (label, error, ...rest native checkbox
 * attributes), not by editing this file's markup. See
 * docs/component-library.md for the full prop reference.
 */
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Checkbox({
  label,
  error,
  id,
  className = "",
  wrapperClassName = "",
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-2">
        <input
          id={checkboxId}
          type="checkbox"
          className={`size-[18px] cursor-pointer rounded-sm border border-outline-variant text-primary accent-primary outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed-dim disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {label ? <span className="text-sm text-on-surface">{label}</span> : null}
      </label>
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </div>
  );
}
