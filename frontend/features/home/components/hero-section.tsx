import { ShieldCheck, Star } from 'lucide-react';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import type { LandingLinks } from '../types';
import { LandingSection } from './landing-section';

type HeroPreviewProps = {
  title: string;
  dealStatus: string;
  sellerRating: string;
  reviewsLabel: string;
  priceLabel: string;
  items: {
    account: string;
    currency: string;
    service: string;
  };
};

function HeroPreview({
  title,
  dealStatus,
  sellerRating,
  reviewsLabel,
  priceLabel,
  items,
}: HeroPreviewProps) {
  const previewItems = [
    {
      name: items.account,
      price: '4 990 ₽',
      rating: 4.9,
      reviews: 128,
      active: true,
    },
    {
      name: items.currency,
      price: '890 ₽',
      rating: 5.0,
      reviews: 312,
      active: false,
    },
    {
      name: items.service,
      price: '2 750 ₽',
      rating: 4.8,
      reviews: 156,
      active: false,
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="landing-preview relative mx-auto w-full max-w-lg lg:max-w-none"
    >
      <div className="landing-preview-glow absolute -inset-4 rounded-[var(--radius-xl)] bg-brand-gradient opacity-20 blur-3xl" />
      <div className="landing-preview-panel relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-[var(--shadow-lg)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
          <h3 className="font-display text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <ShieldCheck className="size-3.5" />
            {dealStatus}
          </span>
        </div>

        <ul className="space-y-3">
          {previewItems.map((item) => (
            <li
              key={item.name}
              className={`rounded-[var(--radius-md)] border p-3 transition-[border-color,background-color,box-shadow] duration-300 ${
                item.active
                  ? 'border-[var(--blue-a24)] bg-[var(--blue-a12)] shadow-[var(--glow-blue)]'
                  : 'border-border bg-surface-elevated hover:border-border-strong'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-warning text-warning" />
                      {item.rating}
                    </span>
                    <span>
                      {reviewsLabel.replace('{count}', String(item.reviews))}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-subtle">
                    {priceLabel}
                  </p>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {item.price}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-[var(--surface-inset)] p-3">
          <p className="mb-2 text-xs text-subtle">{sellerRating}</p>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-primary-foreground">
              PG
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">ProGamer</p>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Star className="size-3 fill-warning text-warning" />
                <span>4.9</span>
                <span>·</span>
                <span>{reviewsLabel.replace('{count}', '128')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type HeroSectionProps = {
  title: string;
  subtitle: string;
  startShoppingLabel: string;
  becomeSellerLabel: string;
  links: LandingLinks;
  preview: HeroPreviewProps;
};

export function HeroSection({
  title,
  subtitle,
  startShoppingLabel,
  becomeSellerLabel,
  links,
  preview,
}: HeroSectionProps) {
  return (
    <LandingSection className="pt-10 sm:pt-16">
      <div className="marketing-hero grid items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div className="relative z-10 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {title}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <BrandButton href={links.startShopping} size="lg">
              {startShoppingLabel}
            </BrandButton>
            <SecondaryButton href={links.becomeSeller} size="lg">
              {becomeSellerLabel}
            </SecondaryButton>
          </div>
        </div>

        <div className="relative z-10">
          <HeroPreview {...preview} />
        </div>
      </div>
    </LandingSection>
  );
}
