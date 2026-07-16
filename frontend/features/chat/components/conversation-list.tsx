'use client';

import { MessagesSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { ConversationListSkeleton } from '@/features/chat/components/chat-skeletons';
import { ConversationListItemRow } from '@/features/chat/components/conversation-list-item';
import type { ConversationListItem } from '@/types/chat';

type ConversationListProps = {
  conversations: ConversationListItem[];
  selectedId: string | null | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function ConversationList({
  conversations,
  selectedId,
  isLoading,
  isError,
  onRetry,
}: ConversationListProps) {
  const t = useTranslations('chat');

  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-2">
        <EmptyState
          title={t('list.loadError')}
          description={t('list.loadErrorHint')}
          action={
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium text-link hover:underline"
            >
              {t('retry')}
            </button>
          }
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-2">
        <EmptyState
          icon={MessagesSquare}
          title={t('list.emptyTitle')}
          description={t('list.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <ul className="flex h-full flex-col gap-0.5 overflow-y-auto p-1">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <ConversationListItemRow
            conversation={conversation}
            isSelected={conversation.id === selectedId}
          />
        </li>
      ))}
    </ul>
  );
}
