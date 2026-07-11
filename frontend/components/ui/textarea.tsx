import { type TextareaHTMLAttributes, forwardRef } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', hasError = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`min-h-[88px] w-full rounded-[var(--radius-sm)] border bg-input px-4 py-3 text-sm text-foreground placeholder:text-placeholder transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-a24)] disabled:cursor-not-allowed disabled:opacity-50 ${
          hasError ? 'border-destructive focus-visible:shadow-none' : 'border-input-border'
        } ${className}`}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
