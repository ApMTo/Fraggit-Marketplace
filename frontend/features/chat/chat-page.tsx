'use client';

import { MessagesSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { ConversationList } from '@/features/chat/components/conversation-list';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { useConversations } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

type ChatPageProps = {
  title: string;
  conversationId?: string;
};

export function ChatPage({ title, conversationId }: ChatPageProps) {
  const t = useTranslations('chat');
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useConversations({ enabled: isAuthenticated });

  const conversations = data?.items ?? [];
  const selected = conversationId
    ? conversations.find((item) => item.id === conversationId)
    : undefined;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1240px] flex-col gap-4 px-5 py-4 sm:gap-5 sm:py-6">
      <div className="shrink-0">
        <h1 className="page-title text-2xl sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-subtle">{t('subtitle')}</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-1 gap-4 overflow-hidden lg:grid-cols-[minmax(260px,340px)_1fr]">
        <aside
          className={cn(
            'surface-card flex h-full min-h-0 flex-col overflow-hidden',
            conversationId ? 'hidden lg:flex' : 'flex',
          )}
        >
          <div className="shrink-0 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              {t('list.title')}
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={conversationId}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
            />
          </div>
        </aside>

        <main
          className={cn(
            'surface-card flex h-full min-h-0 flex-col overflow-hidden',
            conversationId ? 'flex' : 'hidden lg:flex',
          )}
        >
          {conversationId ? (
            <ChatThread
              conversationId={conversationId}
              conversation={selected}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={MessagesSquare}
                title={t('emptySelect.title')}
                description={t('emptySelect.description')}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
