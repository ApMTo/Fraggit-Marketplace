import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import type { LandingLinks } from '../types';
import { LandingSection } from './landing-section';

type CtaSectionProps = {
  title: string;
  subtitle: string;
  startShoppingLabel: string;
  createAccountLabel: string;
  links: LandingLinks;
};

export function CtaSection({
  title,
  subtitle,
  startShoppingLabel,
  createAccountLabel,
  links,
}: CtaSectionProps) {
  return (
    <LandingSection>
      <div className="marketing-hero relative overflow-hidden px-6 py-14 text-center sm:px-10 sm:py-20">
        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
          <div className="space-y-3">
            <h2 className="page-title text-3xl sm:text-4xl">{title}</h2>
            <p className="text-base leading-relaxed text-muted sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <BrandButton href={links.startShopping} size="lg">
              {startShoppingLabel}
            </BrandButton>
            <SecondaryButton href={links.createAccount} size="lg">
              {createAccountLabel}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
