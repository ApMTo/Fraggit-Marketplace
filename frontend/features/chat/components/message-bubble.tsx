'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { ImageLightbox } from '@/features/chat/components/image-lightbox';
import { formatMessageTime } from '@/lib/chat-time';
import { formatSystemChatMessage } from '@/lib/format-system-chat-message';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat';

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  locale: string;
  systemFallback: string;
  enlargeLabel: string;
  closeLightboxLabel: string;
};

export function MessageBubble({
  message,
  isOwn,
  locale,
  systemFallback,
  enlargeLabel,
  closeLightboxLabel,
}: MessageBubbleProps) {
  const t = useTranslations('chat');
  const time = formatMessageTime(message.createdAt, locale);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (message.type === 'SYSTEM') {
    const text = formatSystemChatMessage(message, t, systemFallback);

    return (
      <div className="flex justify-center px-3 py-2">
        <p className="max-w-[85%] rounded-[var(--radius-sm)] bg-surface-elevated px-3 py-1.5 text-center text-xs text-subtle">
          {text}
        </p>
      </div>
    );
  }

  const imageAttachment = message.attachments[0];

  return (
    <div
      className={cn('flex px-3 py-1', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[min(100%,420px)] rounded-[var(--radius-md)] px-3.5 py-2 shadow-[var(--shadow-md)]',
          isOwn
            ? 'rounded-br-sm bg-[linear-gradient(120deg,var(--blue)_0%,var(--purple)_100%)] text-white'
            : 'rounded-bl-sm border border-border bg-surface-elevated text-foreground',
        )}
      >
        {message.type === 'IMAGE' && imageAttachment ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={enlargeLabel}
            className="relative mb-1.5 block max-w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-sm)] text-left"
          >
            <AppImage
              src={imageAttachment.url}
              alt=""
              width={imageAttachment.width ?? 280}
              height={imageAttachment.height ?? 200}
              className="max-h-64 w-auto max-w-full object-cover"
            />
          </button>
        ) : null}

        {message.type === 'TEXT' && message.content ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
        ) : null}

        {time ? (
          <time
            dateTime={message.createdAt}
            className={cn(
              'mt-1 block text-right text-[11px] tabular-nums',
              isOwn ? 'text-white/70' : 'text-subtle',
            )}
          >
            {time}
          </time>
        ) : null}
      </div>

      {imageAttachment ? (
        <ImageLightbox
          open={lightboxOpen}
          src={imageAttachment.url}
          onClose={() => setLightboxOpen(false)}
          closeLabel={closeLightboxLabel}
        />
      ) : null}
    </div>
  );
}
