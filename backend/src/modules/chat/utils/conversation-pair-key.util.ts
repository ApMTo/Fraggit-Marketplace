export function buildConversationPairKey(
  userIdA: string,
  userIdB: string,
): string {
  const [first, second] = [userIdA, userIdB].sort();
  return `${first}:${second}`;
}
