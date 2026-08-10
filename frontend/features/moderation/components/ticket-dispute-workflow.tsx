'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useModerationMutations } from '@/hooks/use-moderation';
import { userProfileHref } from '@/lib/app-nav';
import { resolveApiErrorKey } from '@/lib/api-errors';
import { isStaffRole } from '@/lib/staff';
import type { ModTicket, TicketStatus } from '@/types/moderation';
import type { UserRole } from '@/types/auth';

type Props = {
  ticket: ModTicket;
  ticketId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  /** Compact claim CTA for the ticket header. */
  variant?: 'full' | 'claimOnly';
};

function isOpenStatus(status: TicketStatus): boolean {
  return (
    status === 'OPEN' ||
    status === 'IN_PROGRESS' ||
    status === 'WAITING_USER' ||
    status === 'AWAITING_VERDICT'
  );
}

function isDisputePartyUser(
  ticket: ModTicket,
  currentUserId: string,
): boolean {
  const order = ticket.order;
  return Boolean(
    order &&
      (order.buyerId === currentUserId || order.sellerId === currentUserId),
  );
}

export function canClaimOrderDispute(options: {
  ticket: ModTicket;
  currentUserId: string;
  currentUserRole: UserRole;
}): boolean {
  const { ticket, currentUserId, currentUserRole } = options;
  if (ticket.type !== 'ORDER_DISPUTE' || !ticket.order) {
    return false;
  }
  if (!isStaffRole(currentUserRole)) {
    return false;
  }
  if (!isOpenStatus(ticket.status)) {
    return false;
  }
  if (ticket.assigneeId === currentUserId) {
    return false;
  }
  if (isDisputePartyUser(ticket, currentUserId)) {
    return false;
  }
  return true;
}

/** Staff should see the claim control whenever the dispute is open and not theirs yet. */
export function shouldShowClaimControl(options: {
  ticket: ModTicket;
  currentUserId: string;
  currentUserRole: UserRole;
}): boolean {
  const { ticket, currentUserId, currentUserRole } = options;
  if (ticket.type !== 'ORDER_DISPUTE' || !ticket.order) {
    return false;
  }
  if (!isStaffRole(currentUserRole)) {
    return false;
  }
  if (!isOpenStatus(ticket.status)) {
    return false;
  }
  if (ticket.assigneeId === currentUserId) {
    return false;
  }
  return true;
}

export function TicketDisputeWorkflow({
  ticket,
  ticketId,
  currentUserId,
  currentUserRole,
  variant = 'full',
}: Props) {
  const t = useTranslations('moderation.tickets.workflow');
  const { claimTicket } = useModerationMutations();

  const isStaff = isStaffRole(currentUserRole);
  const isAssignee = ticket.assigneeId === currentUserId;
  const order = ticket.order;
  const isDisputeParty = isDisputePartyUser(ticket, currentUserId);
  const canClaim = canClaimOrderDispute({
    ticket,
    currentUserId,
    currentUserRole,
  });
  const showClaim = shouldShowClaimControl({
    ticket,
    currentUserId,
    currentUserRole,
  });

  async function handleClaim() {
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
  }

  if (ticket.type !== 'ORDER_DISPUTE' || !order) {
    return null;
  }

  if (variant === 'claimOnly') {
    if (!showClaim) {
      return null;
    }
    return (
      <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--link)]/25 bg-[var(--blue-a12)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          {isDisputeParty ? t('partyCannotClaim') : t('claimBeforeReply')}
        </p>
        <Button
          type="button"
          className="w-full shrink-0 sm:w-auto"
          disabled={!canClaim || claimTicket.isPending}
          isLoading={claimTicket.isPending}
          onClick={() => void handleClaim()}
        >
          {t('claim')}
        </Button>
      </div>
    );
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
        <div className="mt-4 space-y-2">
          {isAssignee ? (
            <p className="text-sm font-medium text-[var(--link)]">
              {t('youAreAssignee')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
