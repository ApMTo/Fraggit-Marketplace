import type { ReactNode } from 'react';

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function LandingSection({
  id,
  children,
  className = '',
  containerClassName = '',
}: LandingSectionProps) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
      <div
        className={`mx-auto w-full max-w-site px-5 ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
