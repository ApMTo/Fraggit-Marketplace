'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { useEnsureConversation } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/chat';
import type { OrderUser } from '@/types/order';

type Props = {
  counterparty: OrderUser;
  className?: string;
};

function toConversationPreview(
  conversationId: string,
  counterparty: OrderUser,
): ConversationListItem {
  return {
    id: conversationId,
    lastMessageAt: null,
    createdAt: '',
    otherParticipant: {
      id: counterparty.id,
      username: counterparty.username,
      displayName: counterparty.displayName || counterparty.username,
      avatarUrl: counterparty.avatarUrl,
    },
    lastMessage: null,
    unreadCount: 0,
  };
}

export function OrderChatPanel({ counterparty, className }: Props) {
  const t = useTranslations('orders.chat');
  const { data, isLoading, isError, refetch } = useEnsureConversation(
    counterparty.id,
  );

  const conversation = data?.id
    ? toConversationPreview(data.id, counterparty)
    : undefined;

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-md)]',
        className,
      )}
      aria-label={t('title')}
    >
      {isLoading && !data ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <Spinner />
        </div>
      ) : isError || !data?.id || !conversation ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <p className="text-sm text-muted">{t('loadError')}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : (
        <ChatThread
          conversationId={data.id}
          conversation={conversation}
          variant="panel"
          className="min-h-0 flex-1"
        />
      )}
    </section>
  );
}
