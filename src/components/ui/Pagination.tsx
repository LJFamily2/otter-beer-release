import Link from "next/link";

export type PaginationVariant = "compact" | "pill";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  variant?: PaginationVariant;
  prevLabel?: string;
  nextLabel?: string;
  /** Max number of page-number links shown (they're never virtualized/windowed — fine at this app's post-count scale). */
  maxVisible?: number;
}

/**
 * Shared page-range logic for the two paginated lists in the app (admin
 * table, public blog grid) — the two designs render distinctly different
 * button shapes, so the visual variant is a prop rather than two separate
 * components duplicating the prev/next/active logic.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  variant = "compact",
  prevLabel = "Trước",
  nextLabel = "Sau",
  maxVisible = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    0,
    maxVisible
  );

  const base =
    variant === "pill"
      ? "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold no-underline"
      : "inline-flex min-w-8 items-center justify-center rounded border px-3 py-1 text-sm no-underline";

  const idle =
    variant === "pill"
      ? "border-[rgba(196,198,210,0.5)] text-on-surface-variant"
      : "border-[rgba(196,198,210,0.5)] text-on-surface-variant";
  const active =
    variant === "pill"
      ? "border-primary bg-primary text-on-primary"
      : "border-primary bg-primary text-on-primary";

  function linkClass(disabled: boolean, isActive = false) {
    return `${base} ${isActive ? active : idle} ${disabled ? "pointer-events-none opacity-40" : ""}`;
  }

  return (
    <nav
      className={`flex items-center gap-1 ${variant === "pill" ? "justify-center" : ""}`}
      aria-label="Pagination"
    >
      <Link href={buildHref(Math.max(1, page - 1))} className={linkClass(page <= 1)}>
        {variant === "pill" ? "‹" : prevLabel}
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={linkClass(false, p === page)}
        >
          {p}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        className={linkClass(page >= totalPages)}
      >
        {variant === "pill" ? "›" : nextLabel}
      </Link>
    </nav>
  );
}
