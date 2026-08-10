import api from '@/lib/api';
import type {
  ConversationListResult,
  MarkReadResult,
  MessageListResult,
  StartConversationResult,
  ChatMessage,
} from '@/types/chat';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversationList: (params?: { search?: string; page?: number; limit?: number }) =>
    [...chatKeys.conversations(), params ?? {}] as const,
  /** Separate from conversation list so list cache updaters never see this shape. */
  ensureConversation: (participantUserId: string) =>
    [...chatKeys.all, 'ensure-conversation', participantUserId] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
};

export const chatService = {
  async listConversations(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ConversationListResult> {
    const { data } = await api.get<ConversationListResult>(
      '/chat/conversations',
      { params },
    );
    return data;
  },

  async startConversation(
    participantUserId: string,
  ): Promise<StartConversationResult> {
    const { data } = await api.post<StartConversationResult>(
      '/chat/conversations',
      { participantUserId },
    );
    return data;
  },

  async listMessages(
    conversationId: string,
    params?: { beforeMessageId?: string; limit?: number },
  ): Promise<MessageListResult> {
    const { data } = await api.get<MessageListResult>(
      `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      { params },
    );
    return data;
  },

  async sendTextMessage(
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(
      `/chat/conversations/${encodeURIComponent(conversationId)}/messages/text`,
      { content },
    );
    return data;
  },

  async sendImageMessage(
    conversationId: string,
    payload: {
      url: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
    },
  ): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(
      `/chat/conversations/${encodeURIComponent(conversationId)}/messages/image`,
      payload,
    );
    return data;
  },

  async markAsRead(
    conversationId: string,
    lastReadMessageId: string,
  ): Promise<MarkReadResult> {
    const { data } = await api.post<MarkReadResult>(
      `/chat/conversations/${encodeURIComponent(conversationId)}/read`,
      { lastReadMessageId },
    );
    return data;
  },
};
