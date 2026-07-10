import { type ReactNode } from 'react';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { Logo } from '@/components/layout/logo';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <HeaderPreferences />
      </div>

      <div className="relative z-10 w-full max-w-[420px] space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <Logo />
          <div className="space-y-2">
            <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>
        </div>

        {children}

        {footer ? (
          <div className="text-center text-sm text-subtle">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
