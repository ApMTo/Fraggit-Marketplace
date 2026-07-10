import { type ReactNode } from 'react';

type FormErrorProps = {
  children: ReactNode;
};

export function FormError({ children }: FormErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-sm)] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-[var(--shadow-md)]"
    >
      {children}
    </div>
  );
}
