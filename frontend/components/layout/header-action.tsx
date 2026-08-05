import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HeaderActionProps = {
  label: string;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
};

export function HeaderAction({
  label,
  children,
  className,
  badge,
}: HeaderActionProps) {
  return (
    <span
      className={cn(
        'group inline-flex shrink-0 flex-col items-center gap-1 px-1 text-muted transition-colors hover:text-foreground',
        className,
      )}
    >
      <span className="relative flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground transition-colors group-hover:bg-surface-hover">
        {children}
        {badge}
      </span>
      <span className="whitespace-nowrap text-[11px] leading-none font-medium tracking-wide">
        {label}
      </span>
    </span>
  );
}
