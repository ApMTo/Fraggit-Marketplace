'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { LotMediationThread } from '@/features/moderation/components/lot-mediation-thread';
import { useTicketLotDispute } from '@/hooks/use-moderation';

type Props = { ticketId: string; staffReplyLocked?: boolean };

export function TicketLotMediation({ ticketId, staffReplyLocked }: Props) {
  const t = useTranslations('moderation.reports.lotDispute');
  const tChat = useTranslations('lotDispute');
  const { data, isLoading, isError, refetch } = useTicketLotDispute(ticketId);

  return (
    <section className="space-y-3 rounded-lg border border-border/80 bg-muted/10 p-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{t('title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('orderHint')}</p>
      </div>

      {isLoading && !data ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('error')}</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => refetch()}>
            {tChat('retry')}
          </Button>
        </div>
      ) : data?.room ? (
        <LotMediationThread
          roomId={data.room.id}
          initialData={data}
          staffReplyLocked={staffReplyLocked}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t('error')}</p>
      )}
    </section>
  );
}
