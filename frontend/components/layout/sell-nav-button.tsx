'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HeaderAction } from '@/components/layout/header-action';
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
      className={cn('cursor-pointer outline-none focus-visible:rounded-[var(--radius-sm)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]', className)}
    >
      <HeaderAction label={t('sell')}>
        <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </HeaderAction>
    </Link>
  );
}
