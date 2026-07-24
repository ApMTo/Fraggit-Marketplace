'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { useAuth } from '@/hooks';
import { useModerationMutations, useModTicket } from '@/hooks/use-moderation';
import type { TicketResolution } from '@/types/moderation';
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

export function ModerationTicketDetailPage({ title, ticketId }: Props) {
  const t = useTranslations('moderation.tickets');
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
    <ModerationShell title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !ticket ? (
        <EmptyState title={t('error')} />
      ) : (
        <div className="space-y-6">
          <section className="surface-card rounded-lg p-5">
            <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {ticket.body}
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{t('columns.type')}</dt>
                <dd>{ticket.type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('columns.status')}</dt>
                <dd>{ticket.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('columns.reporter')}</dt>
                <dd>@{ticket.reporter.username}</dd>
              </div>
              {ticket.order ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">{t('columns.order')}</dt>
                    <dd>
                      <Link
                        href={`/orders/${ticket.order.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        #{ticket.order.orderNumber}
                      </Link>
                      {' · '}
                      {ticket.order.status}
                    </dd>
                  </div>
                  {ticket.order.lot ? (
                    <div>
                      <dt className="text-muted-foreground">{t('columns.lot')}</dt>
                      <dd>{ticket.order.lot.title}</dd>
                    </div>
                  ) : null}
                  {ticket.order.autoApproveRemainingMs != null ? (
                    <div>
                      <dt className="text-muted-foreground">
                        {t('columns.timerPaused')}
                      </dt>
                      <dd>{t('timerPaused')}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>

            {canResolve && ticket.status !== 'RESOLVED' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setResolveTo('BUYER_FAVOR')}
                >
                  {t('resolve.buyer')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setResolveTo('SELLER_FAVOR')}
                >
                  {t('resolve.seller')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setResolveTo('NO_ACTION')}
                >
                  {t('resolve.none')}
                </Button>
              </div>
            ) : null}
          </section>

          <section className="surface-card rounded-lg p-5">
            <h3 className="font-medium">{t('messages')}</h3>
            <ul className="mt-3 space-y-3">
              {(ticket.messages ?? []).map((msg) => (
                <li key={msg.id} className="rounded-md border border-border/70 p-3 text-sm">
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
              payload: { resolution: resolveTo, reason },
            });
            toast.success(t('actionSuccess'));
            setResolveTo(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />
    </ModerationShell>
  );
}
