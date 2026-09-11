import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

/**
 * Generic data table — column defs + rows, with an optional title/action
 * header bar and an optional footer (e.g. a result-count summary +
 * Pagination). Column rendering is entirely prop-driven via `render`.
 * AI agents: customize via props (title, action, columns, rows, rowKey,
 * footer), not by editing this file's markup — a new column is a new entry
 * in the `columns` array passed by the caller, not a change here. See
 * docs/component-library.md for the full prop reference.
 */
interface DataTableProps<T> {
  title?: string;
  action?: ReactNode;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  footer?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  title,
  action,
  columns,
  rows,
  rowKey,
  emptyMessage = "No data yet.",
  footer,
  className = "",
}: DataTableProps<T>) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-sm ${className}`}
    >
      {title || action ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 bg-surface-container-low px-6 py-4">
          {title ? (
            <h3 className="font-display text-2xl tracking-wide text-primary">{title}</h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-[13px] font-medium uppercase tracking-wide text-on-surface-variant ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-outline-variant/10">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-base text-on-surface ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">{emptyMessage}</div>
        ) : null}
      </div>
      {footer ? (
        <div className="border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
