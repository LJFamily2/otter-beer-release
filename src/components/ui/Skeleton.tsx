/**
 * Loading-placeholder block — pass width/height/rounded to shape it.
 * AI agents: customize via props (width, height, rounded, className), not
 * by editing this file's markup. See docs/component-library.md for the
 * full prop reference.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "rounded",
  className = "",
}: {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
}) {
  return (
    <span
      className={`block animate-pulse bg-on-surface/10 ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Example composition of Skeleton primitives shaped like a card being
 * loaded (avatar + two lines, paragraph lines, image block). Use this as a
 * reference for composing your own loading states from Skeleton, not as a
 * one-size-fits-all placeholder to edit in place.
 */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`flex max-w-md flex-col gap-4 rounded border border-outline-variant/20 bg-surface p-8 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton width={48} height={48} rounded="rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="30%" height={12} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton height={16} />
        <Skeleton width="85%" height={16} />
        <Skeleton width="45%" height={16} />
      </div>
      <Skeleton height={200} />
    </div>
  );
}
