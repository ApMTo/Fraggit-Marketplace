'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { useModTickets } from '@/hooks/use-moderation';
import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/moderation';

type Props = { title: string; children?: React.ReactNode };

function statusTone(status: TicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]';
    case 'IN_PROGRESS':
    case 'WAITING_USER':
      return 'border-[var(--blue-a24)] bg-[var(--blue-a12)] text-[var(--link)]';
    case 'AWAITING_VERDICT':
      return 'border-[var(--warning)]/40 bg-[var(--warning)]/15 text-[var(--warning)]';
    case 'RESOLVED':
      return 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';
    case 'CLOSED':
      return 'border-border bg-surface-elevated text-muted';
    default:
      return 'border-border bg-surface-elevated text-muted';
  }
}

export function ModerationTicketsPage({ title, children }: Props) {
  const t = useTranslations('moderation.tickets');
  const pathname = usePathname();
  const { data, isLoading, isError } = useModTickets({ limit: 50 });
  const tickets = data?.items ?? [];
  const selectedId = pathname.startsWith('/moderation/tickets/')
    ? pathname.slice('/moderation/tickets/'.length).split('/')[0] || null
    : null;
  const hasDetail = Boolean(children);

  return (
    <ModerationShell title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : tickets.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="grid min-h-[560px] gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <aside
            className={cn(
              'surface-card flex min-h-0 flex-col overflow-hidden rounded-lg',
              hasDetail ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="shrink-0 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('listTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('listCount', { count: tickets.length })}
              </p>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-1">
              {tickets.map((ticket) => {
                const isSelected = ticket.id === selectedId;
                return (
                  <li key={ticket.id}>
                    <Link
                      href={`/moderation/tickets/${ticket.id}`}
                      className={cn(
                        'flex w-full flex-col gap-1 rounded-md px-3 py-2.5 transition-colors',
                        isSelected
                          ? 'bg-foreground text-background'
                          : 'hover:bg-muted',
                      )}
                    >
                      <span className="line-clamp-1 text-sm font-medium">
                        {ticket.subject}
                      </span>
                      <span
                        className={cn(
                          'flex flex-wrap items-center gap-2 text-xs',
                          isSelected
                            ? 'text-background/70'
                            : 'text-muted-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex rounded-[var(--radius-sm)] border px-1.5 py-0.5 text-[10px] font-semibold',
                            isSelected
                              ? 'border-background/30 bg-background/15 text-background'
                              : statusTone(ticket.status),
                          )}
                        >
                          {t(`statusLabels.${ticket.status}`)}
                        </span>
                        <span>@{ticket.reporter.username}</span>
                        {ticket.type === 'ORDER_DISPUTE' ? (
                          <span>
                            {ticket.assignee
                              ? t('listAssignee', {
                                  name: `@${ticket.assignee.username}`,
                                })
                              : t('listUnassigned')}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <main
            className={cn(
              'surface-card min-h-0 overflow-hidden rounded-lg',
              hasDetail ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
            )}
          >
            {hasDetail ? (
              children
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={Ticket}
                  title={t('selectTitle')}
                  description={t('selectDescription')}
                />
              </div>
            )}
          </main>
        </div>
      )}
    </ModerationShell>
  );
}
