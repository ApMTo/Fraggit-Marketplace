import type { StepItem } from '../types';
import { LandingSection } from './landing-section';
import { SectionHeader } from './section-header';

type TimelineStepProps = {
  step: number;
  title: string;
  description: string;
  isLast: boolean;
};

function TimelineStep({ step, title, description, isLast }: TimelineStepProps) {
  return (
    <li className="relative flex gap-4 pb-10 last:pb-0 sm:gap-6">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-[var(--blue-a24)] to-transparent sm:left-[23px]"
        />
      ) : null}

      <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--blue-a24)] bg-[var(--blue-a12)] font-display text-sm font-semibold text-brand-cyan sm:size-12 sm:text-base">
        {step}
      </div>

      <div className="space-y-1 pt-1">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
    </li>
  );
}

type HowItWorksSectionProps = {
  title: string;
  subtitle: string;
  steps: StepItem[];
  getStepTitle: (key: string) => string;
  getStepDescription: (key: string) => string;
};

export function HowItWorksSection({
  title,
  subtitle,
  steps,
  getStepTitle,
  getStepDescription,
}: HowItWorksSectionProps) {
  return (
    <LandingSection id="how-it-works">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <SectionHeader title={title} subtitle={subtitle} align="left" />

        <ol className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 sm:p-8">
          {steps.map((step, index) => (
            <TimelineStep
              key={step.key}
              step={step.step}
              title={getStepTitle(step.key)}
              description={getStepDescription(step.key)}
              isLast={index === steps.length - 1}
            />
          ))}
        </ol>
      </div>
    </LandingSection>
  );
}
