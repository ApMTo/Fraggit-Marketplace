import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '../types';
import { LandingSection } from './landing-section';
import { SectionHeader } from './section-header';

type FaqAccordionItemProps = {
  question: string;
  answer: string;
};

function FaqAccordionItem({ question, answer }: FaqAccordionItemProps) {
  return (
    <details className="landing-faq-item group rounded-[var(--radius-lg)] border border-border bg-surface transition-[border-color,box-shadow] duration-300 open:border-[var(--blue-a24)] open:shadow-[var(--glow-blue)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-display text-base font-semibold text-foreground sm:px-6 sm:py-5 sm:text-lg [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          className="size-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted sm:px-6 sm:pb-6">
        {answer}
      </div>
    </details>
  );
}

type FaqSectionProps = {
  title: string;
  subtitle: string;
  items: FaqItem[];
  getQuestion: (key: string) => string;
  getAnswer: (key: string) => string;
};

export function FaqSection({
  title,
  subtitle,
  items,
  getQuestion,
  getAnswer,
}: FaqSectionProps) {
  return (
    <LandingSection id="faq" className="bg-surface/40">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-3xl space-y-3">
        {items.map((item) => (
          <FaqAccordionItem
            key={item.key}
            question={getQuestion(item.key)}
            answer={getAnswer(item.key)}
          />
        ))}
      </div>
    </LandingSection>
  );
}
