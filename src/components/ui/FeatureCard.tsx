import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "./Button";
import { ChevronRightIcon } from "./icons";

export type FeatureCardVariant = "standard" | "premium" | "dark";

interface FeatureCardCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Promotional/info card — 3 visual treatments in one component instead of 3
 * near-duplicate card files.
 * AI agents: customize via props (variant, eyebrow, title, description,
 * imageSrc, cta, footer), not by editing this file's markup — add a new
 * FeatureCardVariant if an existing one doesn't fit. See
 * docs/component-library.md for the full prop reference.
 */
interface FeatureCardProps {
  variant?: FeatureCardVariant;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  cta?: FeatureCardCta;
  footer?: ReactNode;
  className?: string;
}

export function FeatureCard({
  variant = "standard",
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt = "",
  cta,
  footer,
  className = "",
}: FeatureCardProps) {
  if (variant === "dark") {
    return (
      <div
        className={`flex flex-col justify-between gap-8 rounded-lg bg-primary p-8 text-on-primary shadow-md ${className}`}
      >
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="inline-flex w-fit items-center rounded-sm border border-secondary-fixed-dim px-2.5 py-1 text-xs uppercase tracking-wide text-secondary-fixed-dim">
              {eyebrow}
            </span>
          ) : null}
          <h3 className="font-display text-2xl tracking-wide">{title}</h3>
          <div className="text-inverse-primary">{description}</div>
        </div>
        {footer ? <div className="flex items-center justify-between">{footer}</div> : null}
      </div>
    );
  }

  if (variant === "premium") {
    return (
      <div
        className={`overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-sm ${className}`}
      >
        <div className="relative h-48 w-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_60%,var(--color-secondary-container)_100%)]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 p-8">
          <h3 className="font-display text-2xl tracking-wide text-primary">{title}</h3>
          <div className="text-on-surface-variant">{description}</div>
          {cta ? (
            <FeatureCardLink cta={cta}>
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
                {cta.label}
                <ChevronRightIcon width={16} height={16} />
              </span>
            </FeatureCardLink>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-none border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm ${className}`}
    >
      <h3 className="font-display text-2xl tracking-wide text-primary">{title}</h3>
      <div className="mb-4 text-on-surface-variant">{description}</div>
      {cta ? (
        cta.href ? (
          <Link href={cta.href} className={buttonVariants("secondary", "sm")}>
            {cta.label}
          </Link>
        ) : (
          <button type="button" onClick={cta.onClick} className={buttonVariants("secondary", "sm")}>
            {cta.label}
          </button>
        )
      ) : null}
    </div>
  );
}

function FeatureCardLink({ cta, children }: { cta: FeatureCardCta; children: ReactNode }) {
  if (cta.href) {
    return (
      <Link href={cta.href} className="no-underline">
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className="cursor-pointer text-left">
      {children}
    </button>
  );
}
