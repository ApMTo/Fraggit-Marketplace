'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChatAvatar } from '@/features/chat/components/chat-avatar';
import { getConversationPreview } from '@/lib/chat-preview';
import { formatChatListTime } from '@/lib/chat-time';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/chat';

type ConversationListItemProps = {
  conversation: ConversationListItem;
  isSelected: boolean;
};

export function ConversationListItemRow({
  conversation,
  isSelected,
}: ConversationListItemProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const { otherParticipant, lastMessage, unreadCount, lastMessageAt } =
    conversation;

  const preview = getConversationPreview(lastMessage, {
    image: t('preview.image'),
    system: t('preview.system'),
    empty: t('preview.empty'),
  });

  const timeLabel = formatChatListTime(
    lastMessageAt ?? conversation.createdAt,
    locale,
  );

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={cn(
        'flex w-full items-start gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-left transition-colors duration-150',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-surface-hover',
      )}
    >
      <ChatAvatar
        src={otherParticipant.avatarUrl}
        alt={otherParticipant.displayName}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {otherParticipant.displayName}
          </p>
          {timeLabel ? (
            <time
              dateTime={lastMessageAt ?? conversation.createdAt}
              className="shrink-0 text-xs text-subtle"
            >
              {timeLabel}
            </time>
          ) : null}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              unreadCount > 0 ? 'font-medium text-foreground' : 'text-subtle',
            )}
          >
            {preview}
          </p>

          {unreadCount > 0 ? (
            <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-cyan px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[oklch(0.145_0.018_265)]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
