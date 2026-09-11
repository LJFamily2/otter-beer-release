import type { ReactNode } from "react";

/**
 * The bordered/shadowed white surface repeated everywhere in this design
 * system (login card, KPI cards, table section, sidebar cards, form
 * sections) — see docs/DESIGN.md's "Elevation & Depth" section. Padding is
 * left to the caller since it varies per use site.
 */
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-[rgba(196,198,210,0.3)] bg-surface-container-lowest shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
