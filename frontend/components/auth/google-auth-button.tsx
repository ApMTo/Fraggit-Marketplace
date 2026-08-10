'use client';

type GoogleAuthButtonProps = {
  label: string;
  className?: string;
};

export function GoogleAuthButton({
  label,
  className = '',
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      className={[
        'group relative flex h-11 w-full cursor-pointer items-center justify-center gap-3',
        'overflow-hidden rounded-[var(--radius-sm)] border border-[#e3e5ea]',
        'bg-[linear-gradient(180deg,#ffffff_0%,#f7f8fa_100%)]',
        'text-[0.925rem] font-semibold tracking-[-0.01em] text-[#2a2f3a]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_-12px_rgba(20,24,40,0.45)]',
        'transition-[transform,border-color,box-shadow] duration-300',
        'hover:border-[#c8ccd6]',
        'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_28px_-10px_rgba(20,24,40,0.5),0_0_0_1px_rgba(80,120,255,0.12)]',
        'active:scale-[0.975]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        window.location.assign('/api/auth/google');
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(120deg, transparent 0%, rgba(80,120,255,0.06) 45%, rgba(150,80,220,0.06) 55%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      <span className="relative inline-flex size-[1.65rem] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_#e6e8ee]">
        <GoogleGlyph />
      </span>
      <span className="relative">{label}</span>
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
