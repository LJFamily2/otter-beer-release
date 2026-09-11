import Link from "next/link";
import { ChevronRightIcon } from "./icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Wayfinding trail — last item renders as the current page (no link, bold).
 * AI agents: customize via props (items), not by editing this file's
 * markup. See docs/component-library.md for the full prop reference.
 */
export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 ? <ChevronRightIcon width={10} height={10} className="text-outline-variant" /> : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-xs font-medium uppercase tracking-wide text-on-surface-variant no-underline hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={`text-xs font-medium uppercase tracking-wide ${isLast ? "text-primary" : "text-on-surface-variant"}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
