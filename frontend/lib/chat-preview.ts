import type { ChatMessagePreview, ChatMessageType } from '@/types/chat';

type PreviewLabels = {
  image: string;
  system: string;
  empty: string;
};

export function getMessagePreviewText(
  type: ChatMessageType,
  content: string | null | undefined,
  labels: PreviewLabels,
): string {
  if (type === 'TEXT') {
    const trimmed = content?.trim() ?? '';
    return trimmed || labels.empty;
  }

  if (type === 'IMAGE') {
    return labels.image;
  }

  return labels.system;
}

export function getConversationPreview(
  lastMessage: ChatMessagePreview | null,
  labels: PreviewLabels,
): string {
  if (!lastMessage) {
    return labels.empty;
  }

  return getMessagePreviewText(lastMessage.type, lastMessage.content, labels);
}
