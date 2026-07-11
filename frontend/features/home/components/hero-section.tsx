import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import type { LandingLinks } from '../types';
import { LandingSection } from './landing-section';

type HeroSectionProps = {
  title: string;
  subtitle: string;
  startShoppingLabel: string;
  becomeSellerLabel: string;
  links: LandingLinks;
};

export function HeroSection({
  title,
  subtitle,
  startShoppingLabel,
  becomeSellerLabel,
  links,
}: HeroSectionProps) {
  return (
    <LandingSection className="pt-10 sm:pt-16">
      <div className="marketing-hero px-6 py-12 sm:px-10 sm:py-16 lg:py-20">
        <div className="relative z-10 mx-auto max-w-3xl space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <BrandButton href={links.startShopping} size="lg">
              {startShoppingLabel}
            </BrandButton>
            <SecondaryButton href={links.becomeSeller} size="lg">
              {becomeSellerLabel}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
