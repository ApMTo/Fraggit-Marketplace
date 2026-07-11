import { CHAT_MAX_TEXT_LENGTH } from '../constants/chat.constants';

export function sanitizeMessageText(raw: string): string {
  const withoutTags = raw.replace(/<[^>]*>/g, '');
  const normalized = withoutTags.split('\u0000').join('').trim();

  if (normalized.length > CHAT_MAX_TEXT_LENGTH) {
    return normalized.slice(0, CHAT_MAX_TEXT_LENGTH);
  }

  return normalized;
}
