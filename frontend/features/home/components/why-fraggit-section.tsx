import type { BenefitItem } from '../types';
import { LandingSection } from './landing-section';
import { SectionHeader } from './section-header';

type BenefitCardProps = {
  title: string;
  description: string;
  icon: BenefitItem['icon'];
};

function BenefitCard({ title, description, icon: Icon }: BenefitCardProps) {
  return (
    <article className="landing-card-hover rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5">
      <div className="mb-4 flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--blue-a24)] bg-[var(--blue-a12)]">
        <Icon className="size-5 text-brand-cyan" aria-hidden="true" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </article>
  );
}

type WhyFraggitSectionProps = {
  title: string;
  subtitle: string;
  benefits: BenefitItem[];
  getBenefitTitle: (key: string) => string;
  getBenefitDescription: (key: string) => string;
};

export function WhyFraggitSection({
  title,
  subtitle,
  benefits,
  getBenefitTitle,
  getBenefitDescription,
}: WhyFraggitSectionProps) {
  return (
    <LandingSection id="benefits" className="bg-surface/40">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <BenefitCard
            key={benefit.key}
            title={getBenefitTitle(benefit.key)}
            description={getBenefitDescription(benefit.key)}
            icon={benefit.icon}
          />
        ))}
      </div>
    </LandingSection>
  );
}
