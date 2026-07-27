'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useModerationMutations } from '@/hooks/use-moderation';
import { userProfileHref } from '@/lib/app-nav';
import { resolveApiErrorKey } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { isStaffRole } from '@/lib/staff';
import type { ModTicket, TicketStatus } from '@/types/moderation';
import type { UserRole } from '@/types/auth';

type Props = {
  ticket: ModTicket;
  ticketId: string;
  currentUserId: string;
  currentUserRole: UserRole;
};

function isOpenStatus(status: TicketStatus): boolean {
  return (
    status === 'OPEN' ||
    status === 'IN_PROGRESS' ||
    status === 'WAITING_USER'
  );
}

export function TicketDisputeWorkflow({
  ticket,
  ticketId,
  currentUserId,
  currentUserRole,
}: Props) {
  const t = useTranslations('moderation.tickets.workflow');
  const { claimTicket } = useModerationMutations();

  const isStaff = isStaffRole(currentUserRole);
  const isAssignee = ticket.assigneeId === currentUserId;
  const order = ticket.order;
  const isDisputeParty = Boolean(
    order &&
      (order.buyerId === currentUserId || order.sellerId === currentUserId),
  );
  const canClaim =
    isStaff &&
    !isDisputeParty &&
    isOpenStatus(ticket.status) &&
    !isAssignee;

  if (ticket.type !== 'ORDER_DISPUTE' || !order) {
    return null;
  }

  return (
    <section className="rounded-lg border border-border bg-muted/15 p-4">
      <h3 className="text-sm font-semibold">{t('title')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('staffHint')}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t('buyer')}</dt>
          <dd className="font-medium">
            {order.buyer ? (
              <Link
                href={userProfileHref(order.buyer.username)}
                className="underline-offset-2 hover:underline"
              >
                @{order.buyer.username}
              </Link>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('seller')}</dt>
          <dd className="font-medium">
            {order.seller ? (
              <Link
                href={userProfileHref(order.seller.username)}
                className="underline-offset-2 hover:underline"
              >
                @{order.seller.username}
              </Link>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('openedBy')}</dt>
          <dd className="font-medium">@{ticket.reporter.username}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('assignee')}</dt>
          <dd className="font-medium">
            {ticket.assignee ? `@${ticket.assignee.username}` : t('unassigned')}
          </dd>
        </div>
      </dl>

      {isStaff ? (
        <div
          className={cn(
            'mt-4 flex flex-wrap items-center gap-3',
            isAssignee && 'text-sm text-[var(--success)]',
          )}
        >
          {canClaim ? (
            <Button
              type="button"
              size="sm"
              disabled={claimTicket.isPending}
              onClick={async () => {
                try {
                  await claimTicket.mutateAsync(ticketId);
                  toast.success(t('claimSuccess'));
                } catch (err) {
                  const key = resolveApiErrorKey(err);
                  toast.error(
                    key === 'errors.ticket_claim_party_conflict'
                      ? t('partyCannotClaim')
                      : t('claimError'),
                  );
                }
              }}
            >
              {t('claim')}
            </Button>
          ) : null}
          {isAssignee ? (
            <span className="text-sm font-medium text-[var(--link)]">
              {t('youAreAssignee')}
            </span>
          ) : null}
          {isDisputeParty ? (
            <span className="text-sm text-[var(--warning)]">
              {t('partyCannotClaim')}
            </span>
          ) : null}
          {!isAssignee && !isDisputeParty && isOpenStatus(ticket.status) ? (
            <span className="text-sm text-muted-foreground">
              {t('claimBeforeReply')}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
