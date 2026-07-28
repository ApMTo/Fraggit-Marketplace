'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { useModerationMutations } from '@/hooks/use-moderation';
import { resolveApiErrorKey } from '@/lib/api-errors';
import type { ModTicket, ModTicketMessage } from '@/types/moderation';
import type { UserRole } from '@/types/auth';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];

type Props = {
  ticket: ModTicket;
  ticketId: string;
  currentUserId: string;
  currentUserRole: UserRole;
};

export function TicketRequestVerdictBlock({
  ticket,
  ticketId,
  currentUserId,
  currentUserRole,
}: Props) {
  const t = useTranslations('moderation.tickets.workflow');
  const tTickets = useTranslations('moderation.tickets');
  const { requestTicketVerdict } = useModerationMutations();
  const [verdictOpen, setVerdictOpen] = useState(false);

  const isAdmin = ADMIN_ROLES.includes(currentUserRole);
  const isAssignee = ticket.assigneeId === currentUserId;
  const closed =
    ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  const canRequestVerdict =
    !isAdmin &&
    isAssignee &&
    !closed &&
    ticket.status !== 'AWAITING_VERDICT';

  const internalNotes =
    ticket.messages?.filter((m) => m.isInternal) ?? ([] as ModTicketMessage[]);

  if (
    !isAssignee &&
    !isAdmin &&
    ticket.status !== 'AWAITING_VERDICT' &&
    internalNotes.length === 0
  ) {
    return null;
  }

  return (
    <section className="rounded-lg border border-border bg-muted/10 p-4">
      <h3 className="text-sm font-semibold">{t('handoffTitle')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('handoffHint')}</p>

      {ticket.status === 'AWAITING_VERDICT' ? (
        <p className="mt-3 text-sm font-medium text-[var(--warning)]">
          {isAdmin ? t('awaitingVerdictAdmin') : t('awaitingVerdictMod')}
        </p>
      ) : null}

      {canRequestVerdict ? (
        <Button
          type="button"
          size="sm"
          className="mt-3"
          variant="secondary"
          disabled={requestTicketVerdict.isPending}
          onClick={() => setVerdictOpen(true)}
        >
          {t('requestVerdict')}
        </Button>
      ) : null}

      {internalNotes.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border/60 pt-3">
          {internalNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-dashed border-border/80 bg-background/60 p-3 text-sm"
            >
              <p className="text-xs text-muted-foreground">
                {tTickets('internal')} · @{note.author.username} ·{' '}
                {new Date(note.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <ReasonActionDialog
        open={verdictOpen}
        title={t('requestVerdictTitle')}
        onClose={() => setVerdictOpen(false)}
        onConfirm={async (summary) => {
          try {
            await requestTicketVerdict.mutateAsync({
              id: ticketId,
              summary,
            });
            toast.success(t('requestVerdictSuccess'));
            setVerdictOpen(false);
          } catch (err) {
            const key = resolveApiErrorKey(err);
            toast.error(
              key === 'errors.ticket_already_awaiting_verdict'
                ? t('requestVerdictAlready')
                : t('requestVerdictError'),
            );
          }
        }}
      />
    </section>
  );
}
