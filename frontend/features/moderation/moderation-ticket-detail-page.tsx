'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { ModerationTicketsPage } from '@/features/moderation/moderation-tickets-page';
import { useAuth } from '@/hooks';
import { useModerationMutations, useModTicket } from '@/hooks/use-moderation';
import type { TicketResolution, TicketStatus } from '@/types/moderation';
import type { UserRole as AuthRole } from '@/types/auth';

type Props = { title: string; ticketId: string };

const ADMIN_ROLES: AuthRole[] = [
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
  'OWNER',
];

type TicketMessage = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { username: string; displayName: string };
};

function statusTone(status: TicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]';
    case 'IN_PROGRESS':
    case 'WAITING_USER':
      return 'border-[var(--blue-a24)] bg-[var(--blue-a12)] text-[var(--link)]';
    case 'RESOLVED':
      return 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';
    case 'CLOSED':
      return 'border-border bg-surface-elevated text-muted';
    default:
      return 'border-border bg-surface-elevated text-muted';
  }
}

export function ModerationTicketDetailPage({ title, ticketId }: Props) {
  const t = useTranslations('moderation.tickets');
  const tOrders = useTranslations('orders');
  const { user } = useAuth();
  const { data, isLoading, isError } = useModTicket(ticketId);
  const mutations = useModerationMutations();
  const [message, setMessage] = useState('');
  const [resolveTo, setResolveTo] = useState<TicketResolution | null>(null);

  const canResolve = user && ADMIN_ROLES.includes(user.role);
  const ticket = data as
    | (typeof data & { messages?: TicketMessage[] })
    | undefined;

  return (
    <ModerationTicketsPage title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !ticket ? (
        <EmptyState title={t('error')} />
      ) : (
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
          <Link
            href="/moderation/tickets"
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            ← {t('backToList')}
          </Link>
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{ticket.subject}</h2>
              <span
                className={`inline-flex rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold ${statusTone(ticket.status)}`}
              >
                {t(`statusLabels.${ticket.status}`)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {ticket.body}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{t('columns.type')}</dt>
                <dd className="font-medium">{t(`typeLabels.${ticket.type}`)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('columns.reporter')}</dt>
                <dd className="font-medium">@{ticket.reporter.username}</dd>
              </div>
              {ticket.order ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">{t('columns.order')}</dt>
                    <dd className="font-medium">
                      <Link
                        href={`/orders/${ticket.order.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        #{ticket.order.orderNumber}
                      </Link>
                      {' · '}
                      {ticket.order.status === 'PENDING' ||
                      ticket.order.status === 'AWAITING_BUYER_CONFIRMATION' ||
                      ticket.order.status === 'DISPUTED' ||
                      ticket.order.status === 'APPROVED'
                        ? tOrders(`status.${ticket.order.status}`)
                        : ticket.order.status}
                    </dd>
                  </div>
                  {ticket.order.lot ? (
                    <div>
                      <dt className="text-muted-foreground">{t('columns.lot')}</dt>
                      <dd className="font-medium">{ticket.order.lot.title}</dd>
                    </div>
                  ) : null}
                  {ticket.order.autoApproveRemainingMs != null ? (
                    <div>
                      <dt className="text-muted-foreground">
                        {t('columns.timerPaused')}
                      </dt>
                      <dd className="font-medium">{t('timerPaused')}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
              {ticket.status === 'RESOLVED' && ticket.resolution !== 'NONE' ? (
                <div className="sm:col-span-3 rounded-md border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    {t('resolutionLabel')}
                  </p>
                  <p className="mt-1 font-medium">
                    {t(`resolutionLabels.${ticket.resolution}`)}
                  </p>
                  {ticket.resolutionNote ? (
                    <>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t('resolutionNoteLabel')}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {ticket.resolutionNote}
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </dl>

            {canResolve && ticket.status !== 'RESOLVED' ? (
              <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
                <p className="text-sm text-muted-foreground">{t('resolveHint')}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto flex-col items-start gap-1 px-3 py-3 text-left"
                    onClick={() => setResolveTo('BUYER_FAVOR')}
                  >
                    <span className="font-medium">{t('resolve.buyer')}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {t('resolve.buyerHint')}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto flex-col items-start gap-1 px-3 py-3 text-left"
                    onClick={() => setResolveTo('SELLER_FAVOR')}
                  >
                    <span className="font-medium">{t('resolve.seller')}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {t('resolve.sellerHint')}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto flex-col items-start gap-1 px-3 py-3 text-left"
                    onClick={() => setResolveTo('NO_ACTION')}
                  >
                    <span className="font-medium">{t('resolve.none')}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {t('resolve.noneHint')}
                    </span>
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="font-medium">{t('messages')}</h3>
            <ul className="mt-3 space-y-3">
              {(ticket.messages ?? []).map((msg: TicketMessage) => (
                <li
                  key={msg.id}
                  className="rounded-md border border-border/70 p-3 text-sm"
                >
                  <p className="text-xs text-muted-foreground">
                    @{msg.author.username}
                    {msg.isInternal ? ` · ${t('internal')}` : ''}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (message.trim().length < 1) return;
                try {
                  await mutations.addTicketMessage.mutateAsync({
                    id: ticketId,
                    payload: { body: message.trim(), isInternal: false },
                  });
                  setMessage('');
                  toast.success(t('messageSent'));
                } catch {
                  toast.error(t('actionError'));
                }
              }}
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
              />
              <Button type="submit">{t('send')}</Button>
            </form>
          </section>
        </div>
      )}

      <ReasonActionDialog
        open={Boolean(resolveTo)}
        title={t('resolveTitle')}
        onClose={() => setResolveTo(null)}
        onConfirm={async (reason) => {
          if (!resolveTo) return;
          try {
            await mutations.resolveTicket.mutateAsync({
              id: ticketId,
              payload: {
                resolution: resolveTo,
                reason,
                resolutionNote: reason,
              },
            });
            toast.success(t('actionSuccess'));
            setResolveTo(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />
    </ModerationTicketsPage>
  );
}
