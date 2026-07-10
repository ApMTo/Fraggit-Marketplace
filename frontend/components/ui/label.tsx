import { type LabelHTMLAttributes } from 'react';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = '', ...props }: LabelProps) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-[0.03em] text-muted ${className}`}
      {...props}
    />
  );
}
