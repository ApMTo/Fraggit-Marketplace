import { MessageType, Prisma } from '@prisma/client';

export const CHAT_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type ChatUserPreview = Prisma.UserGetPayload<{
  select: typeof CHAT_USER_SELECT;
}>;

export const MESSAGE_ATTACHMENT_SELECT = {
  id: true,
  url: true,
  mimeType: true,
  size: true,
  width: true,
  height: true,
} satisfies Prisma.MessageAttachmentSelect;

export const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  type: true,
  content: true,
  metadata: true,
  createdAt: true,
  sender: { select: CHAT_USER_SELECT },
  attachments: { select: MESSAGE_ATTACHMENT_SELECT },
} satisfies Prisma.MessageSelect;

export type ChatMessage = Prisma.MessageGetPayload<{
  select: typeof MESSAGE_SELECT;
}>;

export const MESSAGE_PREVIEW_SELECT = {
  id: true,
  type: true,
  content: true,
  metadata: true,
  createdAt: true,
  senderId: true,
  sender: { select: CHAT_USER_SELECT },
} satisfies Prisma.MessageSelect;

export type ChatMessagePreview = Prisma.MessageGetPayload<{
  select: typeof MESSAGE_PREVIEW_SELECT;
}>;

export const CONVERSATION_LIST_SELECT = {
  id: true,
  lastMessageAt: true,
  createdAt: true,
  participants: {
    select: {
      userId: true,
      lastReadAt: true,
      lastReadMessageId: true,
      user: { select: CHAT_USER_SELECT },
    },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: MESSAGE_PREVIEW_SELECT,
  },
} satisfies Prisma.ConversationSelect;

export type ConversationListRow = Prisma.ConversationGetPayload<{
  select: typeof CONVERSATION_LIST_SELECT;
}>;

export function buildMessagePreviewText(
  type: MessageType,
  content: string | null,
): string {
  if (type === MessageType.TEXT) {
    return content?.trim() || '';
  }

  if (type === MessageType.IMAGE) {
    return 'Изображение';
  }

  return 'Системное сообщение';
}
