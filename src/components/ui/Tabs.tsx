"use client";

import { useId, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type TabsVariant = "underline" | "pill" | "segmented";

export interface TabItem {
  value: string;
  label: ReactNode;
}

/**
 * Tab switcher — underline, pill-toggle, or segmented visual style,
 * controlled (pass `value`+`onChange`) or uncontrolled (pass `defaultValue`).
 * `segmented` fills the selected item with `--color-primary` and glides that
 * fill between items, so a section that overrides `--color-primary` gets a
 * control in its own colour for free.
 * AI agents: customize via props (items, variant, value/defaultValue,
 * onChange), not by editing this file's markup. See
 * docs/component-library.md for the full prop reference.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = "underline",
  className = "",
}: {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: TabsVariant;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value);
  const activeValue = value ?? internalValue;
  // Scopes the sliding fill to this instance, so two segmented Tabs on one
  // page do not animate into each other.
  const indicatorId = useId();
  const prefersReducedMotion = useReducedMotion();

  function select(next: string) {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  }

  if (variant === "segmented") {
    return (
      <div className={`inline-flex gap-0 rounded bg-surface-container-high p-1 ${className}`}>
        {items.map((item) => {
          const isActive = activeValue === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => select(item.value)}
              aria-pressed={isActive}
              className={`relative cursor-pointer rounded-sm px-6 py-2 text-xs font-medium transition-colors duration-200 ${
                isActive ? "text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {isActive ? (
                <motion.span
                  aria-hidden
                  layoutId={indicatorId}
                  className="absolute inset-0 rounded-sm bg-primary"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : // Unhurried spring: glides across and settles without
                        // visible bounce, the way an iOS segmented control does.
                        { type: "spring", stiffness: 260, damping: 30, mass: 1 }
                  }
                />
              ) : null}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className={`inline-flex gap-0 rounded bg-surface-container-high p-1 ${className}`}>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => select(item.value)}
            // Without this the selected pill is conveyed by colour alone, so a
            // screen reader announces every option identically.
            aria-pressed={activeValue === item.value}
            className={`cursor-pointer rounded-sm px-6 py-2 text-xs font-medium ${
              activeValue === item.value
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-8 border-b border-outline-variant/30 ${className}`}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => select(item.value)}
          className={`cursor-pointer pb-3.5 text-sm font-bold tracking-wide ${
            activeValue === item.value
              ? "border-b-2 border-secondary-container text-primary"
              : "text-on-surface-variant"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
