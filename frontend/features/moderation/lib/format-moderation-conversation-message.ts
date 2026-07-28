import { formatSystemChatMessage } from '@/lib/format-system-chat-message';
import type { ModConversationMessage } from '@/types/moderation';

type ChatTranslate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

type ConvTranslate = (key: string) => string;

export function moderationMessageSenderLabel(
  message: ModConversationMessage,
  tConv: ConvTranslate,
): string {
  if (message.type === 'SYSTEM') {
    return tConv('systemAuthor');
  }

  if (message.sender) {
    return `@${message.sender.username}`;
  }

  return tConv('deletedSender');
}

export function moderationMessageBody(
  message: ModConversationMessage,
  tChat: ChatTranslate,
  tConv: ConvTranslate,
): string {
  if (message.type === 'TEXT') {
    return message.content?.trim() || '';
  }

  if (message.type === 'IMAGE') {
    return tConv('imageMessage');
  }

  if (message.type === 'SYSTEM') {
    return formatSystemChatMessage(
      {
        content: message.content,
        metadata: (message.metadata as Record<string, unknown> | null | undefined) ?? null,
      },
      tChat,
      tConv('systemMessage'),
    );
  }

  const raw = message.content?.trim();
  if (raw?.startsWith('system.')) {
    return formatSystemChatMessage(
      { content: raw, metadata: message.metadata as Record<string, unknown> },
      tChat,
      tConv('systemMessage'),
    );
  }

  return raw || tConv('systemMessage');
}
