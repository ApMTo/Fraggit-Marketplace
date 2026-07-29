'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  useLotDisputeRoom,
  useModerationMutations,
} from '@/hooks/use-moderation';
import { resolveApiErrorKey } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';
import type { LotDisputeMessage, LotDisputeRoomDetail } from '@/types/moderation';

const STAFF_ROLES: UserRole[] = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'OWNER'];

function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

type Props = {
  roomId: string;
  initialData?: LotDisputeRoomDetail | null;
  className?: string;
  staffReplyLocked?: boolean;
};

function resolveSystemMessage(
  message: LotDisputeMessage,
  t: ReturnType<typeof useTranslations>,
): string {
  const meta = message.metadata as {
    event?: string;
    reporterUsername?: string;
    status?: string;
    assigneeUsername?: string;
  } | null;
  const event = meta?.event ?? message.body;

  switch (event) {
    case 'lot_dispute.report_opened':
      return t('system.reportOpened', {
        reporter: meta?.reporterUsername ?? '?',
      });
    case 'lot_dispute.report_in_review':
      return t('system.reportInReview');
    case 'lot_dispute.report_closed':
      return t('system.reportClosed');
    case 'lot_dispute.ticket_opened':
      return t('system.ticketOpened', {
        reporter: meta?.reporterUsername ?? '?',
      });
    case 'lot_dispute.ticket_closed':
      return t('system.ticketClosed');
    case 'lot_dispute.ticket_claimed':
      return t('system.ticketClaimed', {
        assignee: meta?.assigneeUsername ?? '?',
      });
    default:
      return message.body;
  }
}

function authorLabel(
  message: LotDisputeMessage,
  t: ReturnType<typeof useTranslations>,
): string {
  if (message.kind === 'SYSTEM') {
    return t('systemAuthor');
  }
  if (message.author) {
    if (isStaffRole(message.author.role)) {
      if (message.author.role === 'MODERATOR') {
        return t('moderatorAuthor', { username: message.author.username });
      }
      return t('adminAuthor', { username: message.author.username });
    }
    return `@${message.author.username}`;
  }
  return t('unknownAuthor');
}

export function LotMediationThread({
  roomId,
  initialData,
  className,
  staffReplyLocked = false,
}: Props) {
  const t = useTranslations('lotDispute');
  const { data, isLoading, isError, refetch } = useLotDisputeRoom(roomId);
  const { addLotDisputeMessage } = useModerationMutations();
  const [draft, setDraft] = useState('');

  const detail = data ?? initialData ?? null;
  const closed = detail?.room.status === 'CLOSED';

  const sortedMessages = useMemo(
    () => detail?.messages ?? [],
    [detail?.messages],
  );

  if (!detail && isLoading) {
    return (
      <div className={cn('flex justify-center py-8', className)}>
        <Spinner />
      </div>
    );
  }

  if (!detail && isError) {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="text-sm text-muted-foreground">{t('loadError')}</p>
        <Button type="button" size="sm" variant="secondary" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (!detail) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('loadError')}
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t('participants')}:{' '}
          {detail.participants.length > 0
            ? detail.participants.map((user) => `@${user.username}`).join(', ')
            : '—'}
        </p>
        {closed ? (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {t('closed')}
          </span>
        ) : null}
      </div>

      <ol className="min-h-[120px] max-h-80 space-y-2 overflow-y-auto rounded-md border border-border/70 bg-muted/20 p-3">
        {sortedMessages.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            {t('empty')}
          </li>
        ) : (
          sortedMessages.map((message) => {
            const fromStaff =
              message.kind === 'TEXT' &&
              message.author &&
              isStaffRole(message.author.role);

            return (
            <li
              key={message.id}
              className={cn(
                'rounded-md px-3 py-2 text-sm',
                message.kind === 'SYSTEM'
                  ? 'bg-background/80 text-center text-xs text-muted-foreground'
                  : fromStaff
                    ? 'border border-[var(--link)]/25 bg-[var(--blue-a12)]'
                    : 'bg-background',
              )}
            >
              {message.kind !== 'SYSTEM' ? (
                <p className="text-xs text-muted-foreground">
                  <span
                    className={cn(
                      'font-medium',
                      fromStaff ? 'text-[var(--link)]' : 'text-foreground',
                    )}
                  >
                    {authorLabel(message, t)}
                  </span>
                  <span> · {new Date(message.createdAt).toLocaleString()}</span>
                </p>
              ) : null}
              <p
                className={cn(
                  'whitespace-pre-wrap break-words',
                  message.kind === 'SYSTEM' ? 'mt-0' : 'mt-1',
                )}
              >
                {message.kind === 'SYSTEM'
                  ? resolveSystemMessage(message, t)
                  : message.body}
              </p>
            </li>
            );
          })
        )}
      </ol>

      {!closed ? (
        staffReplyLocked ? (
          <p className="text-sm text-muted-foreground">{t('staffClaimRequired')}</p>
        ) : (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = draft.trim();
            if (body.length < 1) return;
            try {
              await addLotDisputeMessage.mutateAsync({ roomId, body });
              setDraft('');
              await refetch();
            } catch (err) {
              const key = resolveApiErrorKey(err);
              toast.error(
                key === 'errors.ticket_claim_required'
                  ? t('staffClaimRequired')
                  : key === 'errors.ticket_claim_party_conflict'
                    ? t('staffPartyConflict')
                    : t('sendError'),
              );
            }
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('messagePlaceholder')}
            maxLength={4000}
          />
          <Button
            type="submit"
            disabled={addLotDisputeMessage.isPending || draft.trim().length < 1}
          >
            {t('send')}
          </Button>
        </form>
        )
      ) : (
        <p className="text-xs text-muted-foreground">{t('closedHint')}</p>
      )}
    </div>
  );
}
