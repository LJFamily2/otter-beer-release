"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive } from "@/lib/utils/isNavItemActive";

export interface NavSidebarItem {
  label: string;
  icon: ReactNode;
  href: string;
  /** Overrides the automatic route-based highlight — set this explicitly when href isn't a real navigable route (e.g. a "#" placeholder in a demo). */
  active?: boolean;
}

/**
 * Vertical admin-style navigation drawer — header slot, item list, optional
 * footer slot (e.g. divider + settings link). Highlights the item whose
 * href matches the current route automatically (via usePathname()); pass
 * `active` on an item to override that.
 * AI agents: customize via props (header, items, footer), not by editing
 * this file's markup. See docs/component-library.md for the full prop
 * reference.
 */
export function NavSidebar({
  header,
  items,
  footer,
  className = "",
}: {
  header?: ReactNode;
  items: NavSidebarItem[];
  footer?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded border border-outline-variant/30 bg-surface-container-lowest shadow-sm ${className}`}
    >
      {header ? (
        <div className="border-b border-outline-variant/20 px-6 py-6 font-display text-2xl tracking-wide text-primary uppercase">
          {header}
        </div>
      ) : null}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => {
          const isActive = item.active ?? isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded px-3 py-3 text-sm no-underline ${
                isActive
                  ? "bg-secondary-container font-bold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="flex size-[18px] shrink-0 items-center justify-center overflow-hidden">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-outline-variant/20 p-3">{footer}</div> : null}
    </div>
  );
}
