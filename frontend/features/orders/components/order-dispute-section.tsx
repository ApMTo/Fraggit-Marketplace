'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { LotMediationThread } from '@/features/moderation/components/lot-mediation-thread';
import { useOrderDisputeRoom } from '@/hooks/use-moderation';

type Props = {
  orderId: string;
  active: boolean;
};

export function OrderDisputeSection({ orderId, active }: Props) {
  const t = useTranslations('lotDispute');
  const { data, isLoading, isError, refetch } = useOrderDisputeRoom(
    orderId,
    active,
  );
  const room = data?.room ?? null;

  if (!active) {
    return null;
  }

  return (
    <section
      id="order-dispute"
      className="surface-card scroll-mt-24 space-y-4 rounded-lg p-4 sm:p-5"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t('orderTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('orderSubtitle')}</p>
      </div>

      {isLoading && !room ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('loadError')}</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : room ? (
        <LotMediationThread
          roomId={room.id}
          initialData={data?.room ? data : null}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t('noDisputeRoom')}</p>
      )}
    </section>
  );
}
