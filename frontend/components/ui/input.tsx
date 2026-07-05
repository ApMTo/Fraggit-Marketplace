import { type InputHTMLAttributes, forwardRef } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', hasError = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-11 w-full rounded-xl border bg-input px-4 text-sm text-foreground placeholder:text-placeholder transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          hasError ? 'border-destructive' : 'border-input-border'
        } ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
