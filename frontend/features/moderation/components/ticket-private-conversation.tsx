'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useTicketConversation } from '@/hooks/use-moderation';
import { cn } from '@/lib/utils';
import type { ModConversationMessage } from '@/types/moderation';

type Props = { ticketId: string };

function messageBody(
  message: ModConversationMessage,
  t: (key: string) => string,
): string {
  if (message.type === 'TEXT') {
    return message.content?.trim() || '';
  }
  if (message.type === 'IMAGE') {
    return t('imageMessage');
  }
  return message.content?.trim() || t('systemMessage');
}

export function TicketPrivateConversation({ ticketId }: Props) {
  const t = useTranslations('moderation.reports.conversation');
  const [revealed, setRevealed] = useState(false);
  const { data, isLoading, isError } = useTicketConversation(
    revealed ? ticketId : null,
  );

  if (!revealed) {
    return (
      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('privateTitle')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('auditNotice')}</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setRevealed(true)}
        >
          {t('reveal')}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('privateTitle')}
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : data.emptyReason === 'no_order' ? (
        <p className="text-sm text-muted-foreground">{t('noOrder')}</p>
      ) : data.emptyReason === 'no_conversation' ? (
        <p className="text-sm text-muted-foreground">{t('noConversation')}</p>
      ) : data.messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noMessages')}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t('participants')}:{' '}
            {data.participants.map((user) => `@${user.username}`).join(', ')}
          </p>
          <ol className="space-y-1.5">
            {data.messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  'rounded-md border px-3 py-2 text-sm',
                  'border-transparent bg-muted/40',
                )}
              >
                <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {message.sender
                      ? `@${message.sender.username}`
                      : t('deletedSender')}
                  </span>
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words">
                  {messageBody(message, t)}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
