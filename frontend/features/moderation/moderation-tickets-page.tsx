'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { useModTickets } from '@/hooks/use-moderation';

type Props = { title: string };

export function ModerationTicketsPage({ title }: Props) {
  const t = useTranslations('moderation.tickets');
  const { data, isLoading, isError } = useModTickets({ limit: 40 });

  return (
    <ModerationShell title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="surface-card overflow-x-auto rounded-lg">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">{t('columns.subject')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.type')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.reporter')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/moderation/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{ticket.type}</td>
                  <td className="px-4 py-3">{ticket.status}</td>
                  <td className="px-4 py-3">@{ticket.reporter.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModerationShell>
  );
}
