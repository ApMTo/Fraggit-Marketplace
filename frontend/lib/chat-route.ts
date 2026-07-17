export function isChatRoute(pathname: string): boolean {
  return pathname === '/chat' || pathname.startsWith('/chat/');
}

/** Extracts `/chat/:conversationId` when present. */
export function getActiveConversationIdFromPath(
  pathname: string,
): string | null {
  if (!pathname.startsWith('/chat/')) {
    return null;
  }

  const segment = pathname.slice('/chat/'.length).split('/')[0]?.trim();
  return segment || null;
}
