import type { ReactNode } from "react";
import Link from "next/link";

export interface TopNavBarLink {
  label: string;
  href: string;
  active?: boolean;
}

/**
 * Configurable top navigation shell — distinct from the real marketing
 * layout header (src/app/[locale]/(marketing)/layout.tsx), which stays
 * hand-authored for that route group; this component is for other
 * sections (e.g. the design-system showcase, or a future app shell) that
 * need the same visual pattern with different content.
 * AI agents: customize via props (brand, links, action), not by editing
 * this file's markup. See docs/component-library.md for the full prop
 * reference.
 */
export function TopNavBar({
  brand,
  links,
  action,
  className = "",
}: {
  brand: { label: string; href: string };
  links: TopNavBarLink[];
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex h-20 items-center justify-between border-b border-outline-variant/20 bg-surface px-8 ${className}`}>
      <Link href={brand.href} className="font-display text-2xl tracking-wide text-primary uppercase no-underline">
        {brand.label}
      </Link>
      <nav className="hidden items-center gap-6 md:flex">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`text-sm no-underline ${
              link.active
                ? "border-b-2 border-secondary-container pb-1.5 font-bold text-primary"
                : "text-on-surface-variant"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {action}
    </div>
  );
}
