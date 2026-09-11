"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface DropdownMenuItem {
  label: string;
  /** Second line under the label (e.g. "Seasonal and experimental brews."). */
  description?: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** Trailing content on the right (e.g. an arrow or anchor icon). */
  trailing?: ReactNode;
  danger?: boolean;
  /** Highlights the item as the current selection — tinted background + left accent border. */
  active?: boolean;
  /** Solid-fill CTA treatment for a single standout item (e.g. "Book a Table"). */
  featured?: boolean;
  dividerBefore?: boolean;
}

/**
 * Click-triggered dropdown panel (user menu, action menu, nav flyout) —
 * closes on outside click or Escape.
 * AI agents: customize via props (trigger, header, items — including each
 * item's description/active/featured/trailing), not by editing this file's
 * markup. See docs/component-library.md for the full prop reference.
 */
export function DropdownMenu({
  trigger,
  header,
  items,
  className = "",
}: {
  trigger: ReactNode;
  header?: { title: string; subtitle?: string };
  items: DropdownMenuItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="cursor-pointer"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-72 rounded border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-md"
        >
          {header ? (
            <div className="border-b border-outline-variant/20 px-4 py-3">
              <p className="text-sm font-bold text-on-surface">{header.title}</p>
              {header.subtitle ? <p className="text-xs text-on-surface-variant">{header.subtitle}</p> : null}
            </div>
          ) : null}
          <ul className="py-1">
            {items.map((item) => {
              const textClass = item.featured
                ? "text-on-primary-container"
                : item.danger
                  ? "text-error"
                  : item.active
                    ? "font-medium text-primary"
                    : "text-on-surface-variant";

              const content = (
                <span className={`flex items-center gap-3 px-4 py-2.5 text-base ${textClass}`}>
                  {item.icon}
                  <span className="flex-1">
                    <span className="block">{item.label}</span>
                    {item.description ? (
                      <span
                        className={`block text-xs font-normal ${
                          item.featured ? "text-on-primary-container/80" : "text-on-surface-variant"
                        }`}
                      >
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {item.trailing}
                </span>
              );

              const liClass = [
                item.dividerBefore ? "mt-1 border-t border-outline-variant/20 pt-1" : "",
                item.featured
                  ? "mx-2 rounded border-l-4 border-secondary bg-primary-container"
                  : item.active
                    ? "border-l-2 border-primary bg-primary-container/10"
                    : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li key={item.label} className={liClass}>
                  {item.href ? (
                    <Link href={item.href} className="block no-underline" role="menuitem" onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full cursor-pointer text-left"
                      onClick={() => {
                        item.onClick?.();
                        setOpen(false);
                      }}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
