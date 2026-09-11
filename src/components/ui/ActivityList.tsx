import type { ReactNode } from "react";

export interface ActivityListItem {
  icon: ReactNode;
  iconBgClassName?: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

/**
 * Bordered list group for feed-style content (recent activity, notifications).
 * AI agents: customize via props (items, footer), not by editing this file's
 * markup. See docs/component-library.md for the full prop reference.
 */
export function ActivityList({
  items,
  footer,
  className = "",
}: {
  items: ActivityListItem[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded border border-outline-variant/30 bg-surface-container-lowest shadow-sm ${className}`}
    >
      <ul>
        {items.map((item, index) => (
          <li
            key={item.title + index}
            className={`flex items-start gap-4 p-4 ${index > 0 ? "border-t border-outline-variant/20" : ""}`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.iconBgClassName ?? "bg-primary/10 text-primary"}`}
            >
              {item.icon}
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-on-surface">{item.title}</p>
              <p className="text-xs text-on-surface-variant">{item.subtitle}</p>
              <p className="text-xs uppercase tracking-wide text-outline">{item.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
      {footer ? (
        <div className="border-t border-outline-variant/20 bg-surface-container-low p-4 text-center">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
