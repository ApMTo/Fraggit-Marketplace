import type { ChatMessagePreview, ChatMessageType } from '@/types/chat';
import { formatSystemChatMessage } from '@/lib/format-system-chat-message';

type PreviewLabels = {
  image: string;
  system: string;
  empty: string;
};

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export function getMessagePreviewText(
  type: ChatMessageType,
  content: string | null | undefined,
  labels: PreviewLabels,
  options?: {
    metadata?: Record<string, unknown> | null;
    t?: TranslateFn;
  },
): string {
  if (type === 'TEXT') {
    const trimmed = content?.trim() ?? '';
    return trimmed || labels.empty;
  }

  if (type === 'IMAGE') {
    return labels.image;
  }

  if (options?.t) {
    return formatSystemChatMessage(
      { content: content ?? null, metadata: options.metadata ?? null },
      options.t,
      labels.system,
    );
  }

  return labels.system;
}

export function getConversationPreview(
  lastMessage: ChatMessagePreview | null,
  labels: PreviewLabels,
  t?: TranslateFn,
): string {
  if (!lastMessage) {
    return labels.empty;
  }

  return getMessagePreviewText(lastMessage.type, lastMessage.content, labels, {
    metadata: lastMessage.metadata,
    t,
  });
}
