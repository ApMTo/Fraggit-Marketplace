import { type SelectHTMLAttributes, forwardRef } from 'react';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', hasError = false, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-11 w-full rounded-[var(--radius-sm)] border bg-input px-4 text-sm text-foreground transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-a24)] disabled:cursor-not-allowed disabled:opacity-50 ${
          hasError ? 'border-destructive focus-visible:shadow-none' : 'border-input-border'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';
