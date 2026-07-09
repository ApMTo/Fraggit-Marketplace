import { buildConversationPairKey } from './conversation-pair-key.util';

describe('buildConversationPairKey', () => {
  it('returns a stable key regardless of argument order', () => {
    const a = 'user-aaa';
    const b = 'user-bbb';

    expect(buildConversationPairKey(a, b)).toBe(buildConversationPairKey(b, a));
  });

  it('sorts ids lexicographically', () => {
    expect(buildConversationPairKey('z-user', 'a-user')).toBe('a-user:z-user');
  });
});
