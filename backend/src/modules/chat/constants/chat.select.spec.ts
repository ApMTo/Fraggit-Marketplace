import { MessageType } from '@prisma/client';
import { buildMessagePreviewText } from './chat.select';

describe('buildMessagePreviewText', () => {
  it('returns trimmed text for TEXT messages', () => {
    expect(buildMessagePreviewText(MessageType.TEXT, '  hello  ')).toBe(
      'hello',
    );
  });

  it('returns empty string for empty TEXT content', () => {
    expect(buildMessagePreviewText(MessageType.TEXT, null)).toBe('');
  });

  it('returns image label for IMAGE messages', () => {
    expect(buildMessagePreviewText(MessageType.IMAGE, null)).toBe(
      'Изображение',
    );
  });

  it('returns system label for SYSTEM messages', () => {
    expect(buildMessagePreviewText(MessageType.SYSTEM, null)).toBe(
      'Системное сообщение',
    );
  });
});
