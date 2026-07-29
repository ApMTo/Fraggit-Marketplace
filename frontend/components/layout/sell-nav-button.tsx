'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type SellNavButtonProps = {
  href?: string;
  className?: string;
  onClick?: () => void;
};

export function SellNavButton({
  href = '/listings/new',
  className,
  onClick,
}: SellNavButtonProps) {
  const t = useTranslations('listings');

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={t('createLot')}
      className={cn(
        'group inline-flex shrink-0 flex-col items-center gap-1 px-1 text-muted transition-colors hover:text-foreground',
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground transition-colors group-hover:bg-surface-hover">
        <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap text-[11px] leading-none font-medium tracking-wide">
        {t('sell')}
      </span>
    </Link>
  );
}
