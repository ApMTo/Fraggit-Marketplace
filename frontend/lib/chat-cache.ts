import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/services/chat.service';
import type {
  ChatMessage,
  ChatMessagePreview,
  ConversationListItem,
  ConversationListResult,
  MessageListResult,
} from '@/types/chat';

function toPreview(message: ChatMessage): ChatMessagePreview {
  return {
    id: message.id,
    type: message.type,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt,
    senderId: message.senderId,
    sender: message.sender,
  };
}

function sortByActivity(items: ConversationListItem[]): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export function upsertConversationMessage(
  queryClient: QueryClient,
  message: ChatMessage,
  options: {
    currentUserId: string | undefined;
    activeConversationId: string | null | undefined;
  },
): void {
  const isOwn =
    Boolean(message.senderId) && message.senderId === options.currentUserId;
  const isActive = message.conversationId === options.activeConversationId;

  queryClient.setQueriesData<ConversationListResult>(
    { queryKey: chatKeys.conversations() },
    (existing) => {
      if (!existing) {
        return existing;
      }

      const index = existing.items.findIndex(
        (item) => item.id === message.conversationId,
      );

      if (index === -1) {
        void queryClient.invalidateQueries({
          queryKey: chatKeys.conversations(),
        });
        return existing;
      }

      const current = existing.items[index];

      if (current.lastMessage?.id === message.id) {
        return existing;
      }

      const nextUnread =
        isOwn || isActive ? 0 : (current.unreadCount ?? 0) + 1;

      const updated: ConversationListItem = {
        ...current,
        lastMessageAt: message.createdAt,
        lastMessage: toPreview(message),
        unreadCount: nextUnread,
      };

      const items = [...existing.items];
      items.splice(index, 1);
      items.unshift(updated);

      return {
        ...existing,
        items: sortByActivity(items),
      };
    },
  );

  queryClient.setQueryData<InfiniteData<MessageListResult>>(
    chatKeys.messages(message.conversationId),
    (existing) => {
      if (!existing) {
        return {
          pages: [
            {
              items: [message],
              hasMore: false,
              nextBeforeMessageId: null,
            },
          ],
          pageParams: [undefined],
        };
      }

      const alreadyPresent = existing.pages.some((page) =>
        page.items.some((item) => item.id === message.id),
      );

      if (alreadyPresent) {
        return existing;
      }

      const pages = existing.pages.map((page, pageIndex) => {
        if (pageIndex !== 0) {
          return page;
        }

        return {
          ...page,
          items: [...page.items, message],
        };
      });

      return { ...existing, pages };
    },
  );
}

export function clearConversationUnread(
  queryClient: QueryClient,
  conversationId: string,
): void {
  queryClient.setQueriesData<ConversationListResult>(
    { queryKey: chatKeys.conversations() },
    (existing) => {
      if (!existing) {
        return existing;
      }

      return {
        ...existing,
        items: existing.items.map((item) =>
          item.id === conversationId ? { ...item, unreadCount: 0 } : item,
        ),
      };
    },
  );
}

export function flattenMessagePages(
  data: InfiniteData<MessageListResult> | undefined,
): ChatMessage[] {
  if (!data) {
    return [];
  }

  return [...data.pages].reverse().flatMap((page) => page.items);
}
