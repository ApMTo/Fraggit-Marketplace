import type { ChatMessage, ChatMessagePreview } from '@/types/chat';

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

const SYSTEM_EVENT_KEYS: Record<string, string> = {
  order_created: 'system.orderCreated',
  order_credentials: 'system.orderCredentials',
  order_service_completed: 'system.orderServiceCompleted',
  order_approved: 'system.orderApproved',
  order_disputed: 'system.orderDisputed',
};

function readMetaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!metadata) return undefined;
  const value = metadata[key];
  return value == null ? undefined : String(value);
}

/**
 * Resolves system chat message text for the current locale.
 * Falls back to stored content for legacy Russian messages.
 */
export function formatSystemChatMessage(
  message: Pick<ChatMessage | ChatMessagePreview, 'content' | 'metadata'>,
  t: TranslateFn,
  fallback: string,
): string {
  const metadata = message.metadata;
  const event = readMetaString(metadata, 'event');
  const messageKey =
    readMetaString(metadata, 'messageKey') ??
    (event ? SYSTEM_EVENT_KEYS[event] : undefined) ??
    (message.content?.startsWith('system.') ? message.content : undefined);

  if (messageKey) {
    const orderNumber = readMetaString(metadata, 'orderNumber') ?? '';
    try {
      return t(messageKey, { orderNumber });
    } catch {
      // fall through
    }
  }

  const content = message.content?.trim();
  if (content && !content.startsWith('system.')) {
    return content;
  }

  return fallback;
}
