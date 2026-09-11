import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container",
  secondary:
    "border border-[rgba(196,198,210,0.5)] bg-transparent text-on-surface-variant hover:bg-surface-container",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-lg",
};

/** Shared class string so both a real <button> and a styled <Link> (e.g. "Tạo bài viết") can look identical. */
export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md"
): string {
  return `inline-flex items-center justify-center gap-2 rounded font-bold uppercase tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;
}

/**
 * Button — solid primary or outline secondary, three sizes.
 * AI agents: customize via props (variant, size, ...rest native button
 * attributes), not by editing this file's markup or adding one-off classes
 * at call sites. See docs/component-library.md for the full prop reference.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants(variant, size)} ${className}`}
      {...props}
    />
  );
}
