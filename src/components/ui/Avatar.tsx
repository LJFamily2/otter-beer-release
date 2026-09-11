import Image from "next/image";

export type AvatarSize = "sm" | "md" | "lg";

const SIZE_PX: Record<AvatarSize, number> = { sm: 40, md: 48, lg: 64 };
const SIZE_TEXT: Record<AvatarSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl tracking-wide",
};

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

/**
 * Circular/rounded avatar — image if `src` is given, initials fallback
 * otherwise, with an optional online status dot.
 * AI agents: customize via props (src, initials, size, online), not by
 * editing this file's markup. See docs/component-library.md for the full
 * prop reference.
 */
export function Avatar({ src, alt = "", initials, size = "md", online, className = "" }: AvatarProps) {
  const px = SIZE_PX[size];
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: px, height: px }}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className="size-full rounded-xl border-2 border-white object-cover shadow-sm"
        />
      ) : (
        <span
          className={`flex size-full items-center justify-center rounded-xl bg-surface-container-high font-display uppercase text-primary shadow-sm ${SIZE_TEXT[size]}`}
        >
          {initials}
        </span>
      )}
      {online !== undefined ? (
        <span
          className={`absolute bottom-0 right-0 size-3.5 rounded-xl border-2 border-white ${
            online ? "bg-[#10b981]" : "bg-outline-variant"
          }`}
        />
      ) : null}
    </span>
  );
}

interface AvatarGroupItem {
  src?: string;
  initials?: string;
  alt?: string;
}

/**
 * Overlapping stack of small avatars with an optional "+N" overflow badge.
 * AI agents: customize via props (items, max, size), not by editing this
 * file's markup. See docs/component-library.md for the full prop reference.
 */
export function AvatarGroup({
  items,
  max = 3,
  size = "sm",
  className = "",
}: {
  items: AvatarGroupItem[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}) {
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;
  const px = SIZE_PX[size];

  return (
    <span className={`inline-flex items-center ${className}`}>
      {visible.map((item, i) => (
        <span
          key={i}
          className="flex items-center justify-center rounded-xl border-2 border-white bg-primary text-sm text-on-primary shadow-sm"
          style={{ width: px, height: px, marginLeft: i === 0 ? 0 : -px / 3, zIndex: visible.length - i }}
        >
          {item.src ? (
            <Image src={item.src} alt={item.alt ?? ""} width={px} height={px} className="size-full rounded-xl object-cover" />
          ) : (
            item.initials
          )}
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className="flex items-center justify-center rounded-xl border-2 border-white bg-surface-container-high text-sm text-on-surface-variant shadow-sm"
          style={{ width: px, height: px, marginLeft: -px / 3 }}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
