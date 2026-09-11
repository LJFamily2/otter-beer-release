"use client";

import { useState } from "react";
import { ChevronDownIcon } from "./icons";

export interface AccordionItem {
  question: string;
  answer: string;
}

/**
 * FAQ-style accordion — single item open at a time, first item optionally
 * open by default.
 * AI agents: customize via props (items, defaultOpenIndex), not by editing
 * this file's markup — pass a longer/shorter `items` array for different
 * content. See docs/component-library.md for the full prop reference.
 */
export function Accordion({
  items,
  defaultOpenIndex,
  className = "",
}: {
  items: AccordionItem[];
  defaultOpenIndex?: number;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex ?? null);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="rounded border border-outline-variant/30 bg-surface-container-lowest shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full cursor-pointer items-center justify-between p-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-bold uppercase tracking-wide text-primary">
                {item.question}
              </span>
              <ChevronDownIcon
                width={14}
                height={14}
                className={`shrink-0 text-on-surface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-outline-variant/10 p-4 pt-4 text-on-surface-variant">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
