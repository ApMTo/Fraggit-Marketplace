export type ChatMessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export type ChatUserPreview = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ChatMessageAttachment = {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string | null;
  type: ChatMessageType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  sender: ChatUserPreview | null;
  attachments: ChatMessageAttachment[];
};

export type ChatMessagePreview = {
  id: string;
  type: ChatMessageType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  senderId: string | null;
  sender: ChatUserPreview | null;
};

export type ConversationListItem = {
  id: string;
  lastMessageAt: string | null;
  createdAt: string;
  otherParticipant: ChatUserPreview;
  lastMessage: ChatMessagePreview | null;
  unreadCount: number;
};

export type ConversationListResult = {
  items: ConversationListItem[];
  total: number;
  page: number;
  limit: number;
};

export type MessageListResult = {
  items: ChatMessage[];
  hasMore: boolean;
  nextBeforeMessageId: string | null;
};

export type StartConversationResult = {
  id: string;
  created: boolean;
};

export type MarkReadResult = {
  conversationId: string;
  lastReadMessageId: string;
  lastReadAt: string;
};

export type WsMessagePayload = {
  message: ChatMessage;
};

export type WsMarkReadAckPayload = {
  conversationId: string;
  lastReadMessageId: string;
  lastReadAt: string;
  readerUserId?: string;
};

export type WsPresenceUpdatePayload = {
  userId: string;
  online: boolean;
};

export type WsErrorPayload = {
  code: string;
};
