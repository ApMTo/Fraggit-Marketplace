'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { clearConversationUnread } from '@/lib/chat-cache';
import { chatKeys, chatService } from '@/services/chat.service';

export function useConversations(options?: {
  search?: string;
  enabled?: boolean;
}) {
  const search = options?.search?.trim() || undefined;

  return useQuery({
    queryKey: chatKeys.conversationList({ search, page: 1, limit: 50 }),
    queryFn: () =>
      chatService.listConversations({
        search,
        page: 1,
        limit: 50,
      }),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useConversationMessages(
  conversationId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const id = conversationId?.trim() ?? '';

  return useInfiniteQuery({
    queryKey: chatKeys.messages(id),
    queryFn: ({ pageParam }) =>
      chatService.listMessages(id, {
        beforeMessageId: pageParam,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextBeforeMessageId ?? undefined) : undefined,
    enabled: (options?.enabled ?? true) && id.length > 0,
    staleTime: 15_000,
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      lastReadMessageId,
    }: {
      conversationId: string;
      lastReadMessageId: string;
    }) => chatService.markAsRead(conversationId, lastReadMessageId),
    onSuccess: (_data, variables) => {
      clearConversationUnread(queryClient, variables.conversationId);
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantUserId: string) =>
      chatService.startConversation(participantUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      });
    },
  });
}

/** Idempotent: resolves the direct conversation id for a participant. */
export function useEnsureConversation(
  participantUserId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const id = participantUserId?.trim() ?? '';

  return useQuery({
    queryKey: chatKeys.ensureConversation(id),
    queryFn: () => chatService.startConversation(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}
