'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { TicketDisputeWorkflow } from '@/features/moderation/components/ticket-dispute-workflow';
import { TicketLotMediation } from '@/features/moderation/components/ticket-lot-mediation';
import { TicketRequestVerdictBlock } from '@/features/moderation/components/ticket-request-verdict-block';
import { TicketPrivateConversation } from '@/features/moderation/components/ticket-private-conversation';
import { ModerationTicketsPage } from '@/features/moderation/moderation-tickets-page';
import { useAuth } from '@/hooks';
import { isStaffRole } from '@/lib/staff';
import { useModerationMutations, useModTicket } from '@/hooks/use-moderation';
import type { TicketResolution, TicketStatus } from '@/types/moderation';
import type { UserRole as AuthRole } from '@/types/auth';

type Props = { title: string; ticketId: string };

const ADMIN_ROLES: AuthRole[] = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];

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

export function ModerationTicketDetailPage({ title, ticketId }: Props) {
  const t = useTranslations('moderation.tickets');
  const tOrders = useTranslations('orders');
  const { user } = useAuth();
  const { data, isLoading, isError } = useModTicket(ticketId);
  const mutations = useModerationMutations();
  const [resolveTo, setResolveTo] = useState<TicketResolution | null>(null);

  const ticket = data as typeof data | undefined;
  const canResolve = user && ADMIN_ROLES.includes(user.role);
  const isStaff = isStaffRole(user?.role);
  const isAssignee = Boolean(user && ticket?.assigneeId === user.id);
  const isDisputeParty = Boolean(
    user &&
      ticket?.order &&
      (ticket.order.buyerId === user.id ||
        ticket.order.sellerId === user.id),
  );
  const isOrderDispute = ticket?.type === 'ORDER_DISPUTE';
  const showPrivateChat =
    Boolean(isOrderDispute && isStaff && (isAssignee || canResolve));
  const lot = ticket?.order?.lot ?? null;

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

          <div
            className={
              isOrderDispute
                ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]'
                : undefined
            }
          >
            <section className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{ticket.subject}</h2>
                <span
                  className={`inline-flex rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold ${statusTone(ticket.status)}`}
                >
                  {t(`statusLabels.${ticket.status}`)}
                </span>
              </div>

              {isOrderDispute && user && isStaff ? (
                <div className="mt-4">
                  <TicketDisputeWorkflow
                    ticket={ticket}
                    ticketId={ticketId}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                    variant="claimOnly"
                  />
                </div>
              ) : null}
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
                    {lot && !isOrderDispute ? (
                      <div>
                        <dt className="text-muted-foreground">{t('columns.lot')}</dt>
                        <dd className="font-medium">{lot.title}</dd>
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

              {isOrderDispute && user ? (
                <div className="mt-5">
                  <TicketDisputeWorkflow
                    ticket={ticket}
                    ticketId={ticketId}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                  />
                </div>
              ) : null}

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

              {isStaff && user ? (
                <div className="mt-5">
                  <TicketRequestVerdictBlock
                    ticket={ticket}
                    ticketId={ticketId}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                  />
                </div>
              ) : null}
            </section>

            {isOrderDispute ? (
              <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
                {lot ? (
                  <div className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                      {t('columns.lot')}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {lot.title}
                    </p>
                    {ticket.order ? (
                      <Link
                        href={`/orders/${ticket.order.id}`}
                        className="text-xs text-link hover:underline"
                      >
                        #{ticket.order.orderNumber}
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {showPrivateChat ? (
                  <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                    <TicketPrivateConversation ticketId={ticketId} />
                  </div>
                ) : null}
              </aside>
            ) : null}
          </div>

          {isOrderDispute ? (
            <TicketLotMediation
              ticketId={ticketId}
              staffReplyLock={
                isStaff && !isDisputeParty && !isAssignee ? 'claim' : null
              }
            />
          ) : null}
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
