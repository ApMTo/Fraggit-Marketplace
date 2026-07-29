'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import {
  moderationMessageBody,
  moderationMessageSenderLabel,
} from '@/features/moderation/lib/format-moderation-conversation-message';
import {
  useUserReportConversation,
  useUserReportConversations,
} from '@/hooks/use-moderation';
import { cn } from '@/lib/utils';

type Props = { reportId: string };

export function UserReportConversations({ reportId }: Props) {
  const t = useTranslations('moderation.reports.conversation');
  const tChat = useTranslations('chat');
  const [revealed, setRevealed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useUserReportConversations(revealed ? reportId : null);
  const thread = useUserReportConversation(
    revealed && selectedId ? reportId : null,
    selectedId,
  );

  if (!revealed) {
    return (
      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('userTitle')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('userAuditNotice')}</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setRevealed(true)}
        >
          {t('userRevealList')}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('userTitle')}
      </h3>

      {list.isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : list.isError || !list.data ? (
        <EmptyState title={t('error')} />
      ) : list.data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('userNoThreads')}</p>
      ) : (
        <ul className="space-y-2">
          {list.data.items.map((item) => {
            const active = item.conversationId === selectedId;
            const preview =
              item.lastMessage?.type === 'IMAGE'
                ? t('imageMessage')
                : item.lastMessage?.content?.trim() || t('noMessages');
            return (
              <li key={item.conversationId}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      active ? null : item.conversationId,
                    )
                  }
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    active
                      ? 'border-[var(--link)] bg-[var(--blue-a12)]'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <p className="font-medium">
                    {item.participants
                      .map((u) => `@${u.username}`)
                      .join(' · ')}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {preview}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedId ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          {thread.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : thread.isError || !thread.data ? (
            <EmptyState title={t('error')} />
          ) : thread.data.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noMessages')}</p>
          ) : (
            <ol className="max-h-80 space-y-1.5 overflow-y-auto">
              {thread.data.messages.map((message) => {
                const isSystem = message.type === 'SYSTEM';
                return (
                  <li
                    key={message.id}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm',
                      isSystem
                        ? 'border-transparent bg-muted/25 text-center'
                        : 'border-transparent bg-background/80',
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
                      <span>
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
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
          )}
        </div>
      ) : null}
    </section>
  );
}
