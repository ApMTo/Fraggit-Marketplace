'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { useConversations } from '@/hooks/use-chat';
import { useChatRealtime } from '@/hooks/use-chat-realtime';
import {
  getActiveConversationIdFromPath,
  isChatRoute,
} from '@/lib/chat-route';
import { unlockChatSound } from '@/lib/chat-sound';
import { useAuth } from '@/providers/AuthProvider';

type ChatNavIconProps = {
  enabled: boolean;
};

export function ChatNavIcon({ enabled }: ChatNavIconProps) {
  const t = useTranslations('common.nav');
  const pathname = usePathname();
  const { user } = useAuth();
  const onChatPage = isChatRoute(pathname);
  const activeConversationId = getActiveConversationIdFromPath(pathname);

  useChatRealtime({
    currentUserId: user?.id,
    activeConversationId,
    enabled,
    alertSound: true,
  });

  const conversationsQuery = useConversations({ enabled });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unlock = () => unlockChatSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const unreadTotal =
    conversationsQuery.data?.items.reduce(
      (sum, item) => sum + (item.unreadCount ?? 0),
      0,
    ) ?? 0;

  const showBadge = !onChatPage && unreadTotal > 0;

  return (
    <Link
      href="/chat"
      aria-label={t('chat')}
      className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted transition-[background-color,color] duration-300 hover:bg-surface-elevated hover:text-foreground"
    >
      <MessageSquare className="size-4" />
      {showBadge ? (
        <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-brand-cyan px-1 text-[10px] font-semibold leading-none text-[oklch(0.145_0.018_265)]">
          {unreadTotal > 9 ? '9+' : unreadTotal}
        </span>
      ) : null}
    </Link>
  );
}
