'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { HeaderAction } from '@/components/layout/header-action';
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

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand-cyan px-1 text-[10px] font-semibold leading-none text-[oklch(0.145_0.018_265)]">
      {count > 9 ? '9+' : count}
    </span>
  );
}

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
  const badge = showBadge ? <UnreadBadge count={unreadTotal} /> : null;

  return (
    <Link
      href="/chat"
      aria-label={t('chat')}
      className="hidden cursor-pointer outline-none focus-visible:rounded-[var(--radius-sm)] focus-visible:ring-2 focus-visible:ring-[var(--focus)] md:inline-flex"
    >
      <HeaderAction label={t('chat')} badge={badge}>
        <MessageSquare className="size-4" aria-hidden="true" />
      </HeaderAction>
    </Link>
  );
}
