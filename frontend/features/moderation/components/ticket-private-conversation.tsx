'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useTicketConversation } from '@/hooks/use-moderation';
import {
  moderationMessageBody,
  moderationMessageSenderLabel,
} from '@/features/moderation/lib/format-moderation-conversation-message';
import { cn } from '@/lib/utils';

type Props = { ticketId: string };

export function TicketPrivateConversation({ ticketId }: Props) {
  const t = useTranslations('moderation.reports.conversation');
  const tChat = useTranslations('chat');
  const [revealed, setRevealed] = useState(false);
  const { data, isLoading, isError } = useTicketConversation(
    revealed ? ticketId : null,
  );

  if (!revealed) {
    return (
      <section className="space-y-2">
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
    <section className="space-y-3">
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
          <ol className="max-h-[min(28rem,50dvh)] space-y-1.5 overflow-y-auto">
            {data.messages.map((message) => {
              const isSystem = message.type === 'SYSTEM';
              return (
                <li
                  key={message.id}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm',
                    isSystem
                      ? 'border-transparent bg-muted/25 text-center'
                      : 'border-transparent bg-muted/40',
                  )}
                >
                  <div
                    className={cn(
                      'flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground',
                      isSystem && 'justify-center',
                    )}
                  >
                    <span className="font-medium text-foreground">
                      {moderationMessageSenderLabel(message, t)}
                    </span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 whitespace-pre-wrap break-words',
                      isSystem && 'text-subtle',
                    )}
                  >
                    {moderationMessageBody(message, tChat, t)}
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
