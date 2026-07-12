'use client';

import type { LotListItem } from '@/types/lot';
import { LotCard } from './lot-card';

type LotGridProps = {
  lots: LotListItem[];
  categorySlug: string;
  subcategorySlug: string;
};

export function LotGrid({
  lots,
  categorySlug,
  subcategorySlug,
}: LotGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lots.map((lot) => (
        <LotCard
          key={lot.id}
          lot={lot}
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
        />
      ))}
    </div>
  );
}
