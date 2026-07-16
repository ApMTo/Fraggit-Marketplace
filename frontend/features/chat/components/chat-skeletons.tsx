export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-[var(--radius-sm)] px-3 py-3"
        >
          <div className="size-11 shrink-0 animate-pulse rounded-full bg-surface-elevated" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-surface-elevated" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageThreadSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-6" aria-hidden="true">
      <div className="flex justify-start">
        <div className="h-12 w-2/5 animate-pulse rounded-[var(--radius-md)] bg-surface-elevated" />
      </div>
      <div className="flex justify-end">
        <div className="h-16 w-1/2 animate-pulse rounded-[var(--radius-md)] bg-surface-elevated" />
      </div>
      <div className="flex justify-start">
        <div className="h-10 w-1/3 animate-pulse rounded-[var(--radius-md)] bg-surface-elevated" />
      </div>
      <div className="flex justify-end">
        <div className="h-14 w-2/5 animate-pulse rounded-[var(--radius-md)] bg-surface-elevated" />
      </div>
    </div>
  );
}
