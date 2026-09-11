export function AdminTableSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-surface-container-high" />
        <span className="text-on-surface-variant/40">/</span>
        <div className="h-4 w-28 rounded bg-surface-container-high" />
      </div>

      {/* Header section skeleton */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-64 rounded bg-surface-container-high" />
          <div className="h-4 w-96 rounded bg-surface-container" />
        </div>
        <div className="h-10 w-36 rounded-md bg-surface-container-high" />
      </div>

      {/* Info card skeleton */}
      <div className="h-14 rounded-lg bg-surface-container-low border border-outline-variant/30 p-4" />

      {/* Data Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low px-6 py-4">
          <div className="h-7 w-48 rounded bg-surface-container-high" />
          <div className="h-9 w-56 rounded bg-surface-container" />
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                <th className="px-6 py-4"><div className="h-4 w-20 rounded bg-surface-container-high" /></th>
                <th className="px-6 py-4"><div className="h-4 w-24 rounded bg-surface-container-high" /></th>
                <th className="px-6 py-4"><div className="h-4 w-16 rounded bg-surface-container-high" /></th>
                <th className="px-6 py-4"><div className="h-4 w-20 rounded bg-surface-container-high" /></th>
                <th className="px-6 py-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-surface-container-high" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-outline-variant/10">
                  <td className="px-6 py-5"><div className="h-4 w-32 rounded bg-surface-container" /></td>
                  <td className="px-6 py-5"><div className="h-4 w-24 rounded bg-surface-container" /></td>
                  <td className="px-6 py-5"><div className="h-4 w-16 rounded bg-surface-container" /></td>
                  <td className="px-6 py-5"><div className="h-4 w-28 rounded bg-surface-container" /></td>
                  <td className="px-6 py-5 text-right"><div className="ml-auto h-4 w-12 rounded bg-surface-container" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
          <div className="h-4 w-48 rounded bg-surface-container" />
          <div className="h-8 w-32 rounded bg-surface-container-high" />
        </div>
      </div>
    </div>
  );
}
