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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
