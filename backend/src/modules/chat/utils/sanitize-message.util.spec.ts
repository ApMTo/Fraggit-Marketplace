import { CHAT_MAX_TEXT_LENGTH } from '../constants/chat.constants';
import { sanitizeMessageText } from './sanitize-message.util';

describe('sanitizeMessageText', () => {
  it('strips HTML tags and trims whitespace', () => {
    expect(sanitizeMessageText('  <b>hello</b> world  ')).toBe('hello world');
  });

  it('removes null bytes', () => {
    expect(sanitizeMessageText('hi\u0000there')).toBe('hithere');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeMessageText('   \n\t  ')).toBe('');
  });

  it('truncates text longer than CHAT_MAX_TEXT_LENGTH', () => {
    const long = 'a'.repeat(CHAT_MAX_TEXT_LENGTH + 50);
    const result = sanitizeMessageText(long);

    expect(result).toHaveLength(CHAT_MAX_TEXT_LENGTH);
    expect(result).toBe('a'.repeat(CHAT_MAX_TEXT_LENGTH));
  });
});
