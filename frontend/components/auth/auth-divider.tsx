type AuthDividerProps = {
  label: string;
};

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div
      className="flex w-full items-center gap-3.5"
      role="separator"
      aria-label={label}
    >
      <span
        className="h-px flex-1"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--border) 20%, var(--border) 80%, transparent 100%)',
        }}
      />
      <span className="shrink-0 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-[var(--subtle)]">
        {label}
      </span>
      <span
        className="h-px flex-1"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--border) 20%, var(--border) 80%, transparent 100%)',
        }}
      />
    </div>
  );
}
