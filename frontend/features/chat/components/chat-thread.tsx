'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ChatAvatar } from '@/features/chat/components/chat-avatar';
import { MessageThreadSkeleton } from '@/features/chat/components/chat-skeletons';
import { MessageBubble } from '@/features/chat/components/message-bubble';
import { MessageComposer } from '@/features/chat/components/message-composer';
import {
  emitChatMarkRead,
  sendChatTextMessage,
} from '@/hooks/use-chat-realtime';
import { useConversationMessages } from '@/hooks/use-chat';
import { flattenMessagePages, clearConversationUnread, upsertConversationMessage } from '@/lib/chat-cache';
import { readImageDimensions } from '@/lib/chat-image';
import {
  formatMessageDayLabel,
  shouldShowDaySeparator,
} from '@/lib/chat-time';
import { resolveApiErrorKey } from '@/lib/api-errors';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { filesService } from '@/services/files.service';
import type { ConversationListItem } from '@/types/chat';

type ChatThreadProps = {
  conversationId: string;
  conversation: ConversationListItem | undefined;
};

export function ChatThread({ conversationId, conversation }: ChatThreadProps) {
  const t = useTranslations('chat');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useConversationMessages(conversationId);

  const messages = flattenMessagePages(data);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastMarkedIdRef = useRef<string | null>(null);

  const other = conversation?.otherParticipant;

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) {
      return;
    }

    const el = scrollRef.current;
    if (!el) {
      return;
    }

    el.scrollTop = el.scrollHeight;
  }, [messages.length, conversationId]);

  useEffect(() => {
    stickToBottomRef.current = true;
    lastMarkedIdRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.id === lastMarkedIdRef.current) {
      return;
    }

    lastMarkedIdRef.current = lastMessage.id;
    emitChatMarkRead(conversationId, lastMessage.id);
    clearConversationUnread(queryClient, conversationId);
  }, [messages, conversationId, queryClient]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;

    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      const previousHeight = el.scrollHeight;
      void fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop =
              scrollRef.current.scrollHeight - previousHeight;
          }
        });
      });
    }
  }

  async function handleSendText(content: string) {
    setSendError(null);
    setIsSending(true);
    stickToBottomRef.current = true;

    try {
      const message = await sendChatTextMessage(conversationId, content);
      upsertConversationMessage(queryClient, message, {
        currentUserId: user?.id,
        activeConversationId: conversationId,
      });
    } catch (error) {
      const key = resolveApiErrorKey(error);
      setSendError(tErrors(key));
      throw error;
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendImage(file: File) {
    setSendError(null);
    setIsSending(true);
    stickToBottomRef.current = true;

    try {
      const [{ url }, dimensions] = await Promise.all([
        filesService.uploadImage(file),
        readImageDimensions(file).catch(() => ({
          width: undefined as number | undefined,
          height: undefined as number | undefined,
        })),
      ]);

      const message = await chatService.sendImageMessage(conversationId, {
        url,
        mimeType: file.type,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
      });

      upsertConversationMessage(queryClient, message, {
        currentUserId: user?.id,
        activeConversationId: conversationId,
      });
    } catch (error) {
      const key = resolveApiErrorKey(error);
      setSendError(tErrors(key));
      throw error;
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-3 sm:px-4">
        <Link
          href="/chat"
          className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-subtle transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
          aria-label={t('thread.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        {other ? (
          <>
            <ChatAvatar
              src={other.avatarUrl}
              alt={other.displayName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {other.displayName}
              </p>
              <p className="truncate text-xs text-subtle">@{other.username}</p>
            </div>
          </>
        ) : (
          <p className="text-sm font-semibold text-foreground">
            {t('thread.title')}
          </p>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto py-3"
      >
        {isFetchingNextPage ? (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        ) : null}

        {isLoading ? <MessageThreadSkeleton /> : null}

        {isError ? (
          <div className="p-4">
            <EmptyState
              title={t('thread.loadError')}
              description={t('thread.loadErrorHint')}
              action={
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="text-sm font-medium text-link hover:underline"
                >
                  {t('retry')}
                </button>
              }
            />
          </div>
        ) : null}

        {!isLoading && !isError && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              icon={MessageCircle}
              title={t('thread.emptyTitle')}
              description={t('thread.emptyDescription')}
            />
          </div>
        ) : null}

        {!isLoading && !isError
          ? messages.map((message, index) => {
              const previous = messages[index - 1] ?? null;
              const showDay = shouldShowDaySeparator(
                message.createdAt,
                previous?.createdAt ?? null,
              );

              return (
                <div key={message.id}>
                  {showDay ? (
                    <div className="flex justify-center py-3">
                      <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs text-subtle">
                        {formatMessageDayLabel(message.createdAt, locale)}
                      </span>
                    </div>
                  ) : null}
                  <MessageBubble
                    message={message}
                    isOwn={Boolean(
                      user?.id && message.senderId === user.id,
                    )}
                    locale={locale}
                    systemFallback={t('preview.system')}
                    enlargeLabel={t('thread.enlargeImage')}
                    closeLightboxLabel={t('thread.closeImage')}
                  />
                </div>
              );
            })
          : null}
      </div>

      {sendError ? (
        <p className="shrink-0 border-t border-border px-4 py-2 text-xs text-destructive">
          {sendError}
        </p>
      ) : null}

      <div className="shrink-0">
        <MessageComposer
          disabled={isLoading || isError}
          isSending={isSending}
          onSendText={handleSendText}
          onSendImage={handleSendImage}
        />
      </div>
    </div>
  );
}
