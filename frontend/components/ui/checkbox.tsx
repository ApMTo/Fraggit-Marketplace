import { cn } from '@/lib/utils';

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  hasError?: boolean;
};

function Checkbox({ className, hasError, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        'mt-0.5 size-4 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-border bg-surface text-brand-cyan accent-brand-cyan',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasError && 'border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
