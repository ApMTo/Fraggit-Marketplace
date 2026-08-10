'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ImageLightbox } from '@/features/chat/components/image-lightbox';
import { MessageComposer } from '@/features/chat/components/message-composer';
import {
  applyDisputeMessageToCache,
  sendDisputeMessage,
} from '@/hooks/use-dispute-realtime';
import {
  useLotDisputeRoom,
} from '@/hooks/use-moderation';
import { resolveApiErrorKey } from '@/lib/api-errors';
import { readImageDimensions } from '@/lib/chat-image';
import { formatMessageTime } from '@/lib/chat-time';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { filesService } from '@/services/files.service';
import type { UserRole } from '@/types/auth';
import type {
  LotDisputeImageMetadata,
  LotDisputeMessage,
  LotDisputeRoomDetail,
} from '@/types/moderation';

const STAFF_ROLES: UserRole[] = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'OWNER'];

function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

function isImageMetadata(
  metadata: LotDisputeMessage['metadata'],
): metadata is LotDisputeImageMetadata {
  return Boolean(
    metadata &&
      typeof metadata === 'object' &&
      'url' in metadata &&
      typeof metadata.url === 'string',
  );
}

type Props = {
  roomId: string;
  initialData?: LotDisputeRoomDetail | null;
  className?: string;
  /** Staff cannot reply until they claim; parties write as themselves. */
  staffReplyLock?: 'claim' | null;
};

function resolveSystemMessage(
  message: LotDisputeMessage,
  t: ReturnType<typeof useTranslations>,
): string {
  const meta = message.metadata as {
    event?: string;
    reporterUsername?: string;
    status?: string;
    assigneeUsername?: string;
  } | null;
  const event = meta?.event ?? message.body;

  switch (event) {
    case 'lot_dispute.report_opened':
      return t('system.reportOpened', {
        reporter: meta?.reporterUsername ?? '?',
      });
    case 'lot_dispute.report_in_review':
      return t('system.reportInReview');
    case 'lot_dispute.report_closed':
      return t('system.reportClosed');
    case 'lot_dispute.ticket_opened':
      return t('system.ticketOpened', {
        reporter: meta?.reporterUsername ?? '?',
      });
    case 'lot_dispute.ticket_closed':
      return t('system.ticketClosed');
    case 'lot_dispute.ticket_claimed':
      return t('system.ticketClaimed', {
        assignee: meta?.assigneeUsername ?? '?',
      });
    default:
      return message.body;
  }
}

function authorLabel(
  message: LotDisputeMessage,
  t: ReturnType<typeof useTranslations>,
): string {
  if (message.kind === 'SYSTEM') {
    return t('systemAuthor');
  }
  if (message.author) {
    if (isStaffRole(message.author.role)) {
      if (message.author.role === 'MODERATOR') {
        return t('moderatorAuthor', { username: message.author.username });
      }
      return t('adminAuthor', { username: message.author.username });
    }
    return `@${message.author.username}`;
  }
  return t('unknownAuthor');
}

function sendErrorToast(
  err: unknown,
  t: ReturnType<typeof useTranslations>,
) {
  const key = resolveApiErrorKey(err);
  toast.error(
    key === 'errors.ticket_claim_required'
      ? t('staffClaimRequired')
      : key === 'errors.ticket_claim_party_conflict'
        ? t('staffPartyConflict')
        : t('sendError'),
  );
}

type DisputeMessageBubbleProps = {
  message: LotDisputeMessage;
  isOwn: boolean;
  locale: string;
  enlargeLabel: string;
  closeLightboxLabel: string;
  t: ReturnType<typeof useTranslations>;
};

function DisputeMessageBubble({
  message,
  isOwn,
  locale,
  enlargeLabel,
  closeLightboxLabel,
  t,
}: DisputeMessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const time = formatMessageTime(message.createdAt, locale);
  const fromStaff =
    Boolean(message.author) && isStaffRole(message.author!.role);
  const image =
    message.kind === 'IMAGE' && isImageMetadata(message.metadata)
      ? message.metadata
      : null;

  if (message.kind === 'SYSTEM') {
    return (
      <div className="flex justify-center px-1 py-2">
        <p className="max-w-[85%] rounded-[var(--radius-sm)] bg-surface-elevated px-3 py-1.5 text-center text-xs text-subtle">
          {resolveSystemMessage(message, t)}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex px-1 py-1', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div className="max-w-[min(100%,420px)]">
        {!isOwn ? (
          <p
            className={cn(
              'mb-1 px-1 text-xs font-medium',
              fromStaff ? 'text-[var(--link)]' : 'text-subtle',
            )}
          >
            {authorLabel(message, t)}
          </p>
        ) : null}

        <div
          className={cn(
            'rounded-[var(--radius-md)] px-3.5 py-2 shadow-[var(--shadow-md)]',
            isOwn
              ? 'rounded-br-sm bg-[linear-gradient(120deg,var(--blue)_0%,var(--purple)_100%)] text-white'
              : fromStaff
                ? 'rounded-bl-sm border border-[var(--link)]/30 bg-[var(--blue-a12)] text-foreground'
                : 'rounded-bl-sm border border-border bg-surface-elevated text-foreground',
          )}
        >
          {image ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={enlargeLabel}
              className="relative mb-1.5 block max-w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-sm)] text-left"
            >
              <AppImage
                src={image.url}
                alt={t('imageAlt')}
                width={image.width ?? 280}
                height={image.height ?? 200}
                className="max-h-64 w-auto max-w-full object-cover"
                unoptimized
              />
            </button>
          ) : null}

          {message.kind === 'TEXT' ||
          (image && message.body && message.body !== '[image]') ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.body}
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
      </div>

      {image ? (
        <ImageLightbox
          open={lightboxOpen}
          src={image.url}
          onClose={() => setLightboxOpen(false)}
          closeLabel={closeLightboxLabel}
        />
      ) : null}
    </div>
  );
}

export function LotMediationThread({
  roomId,
  initialData,
  className,
  staffReplyLock = null,
}: Props) {
  const t = useTranslations('lotDispute');
  const tChat = useTranslations('chat');
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useLotDisputeRoom(roomId);
  const [isSending, setIsSending] = useState(false);

  const detail = data ?? initialData ?? null;
  const closed = detail?.room.status === 'CLOSED';

  const sortedMessages = useMemo(
    () => detail?.messages ?? [],
    [detail?.messages],
  );

  async function handleSendText(content: string) {
    setIsSending(true);
    try {
      const message = await sendDisputeMessage(roomId, { body: content });
      applyDisputeMessageToCache(queryClient, roomId, message, {
        orderId: detail?.room.orderId,
        ticketId: detail?.room.ticketId,
      });
    } catch (err) {
      sendErrorToast(err, t);
      throw err;
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendImage(file: File) {
    setIsSending(true);
    try {
      const [{ url }, dimensions] = await Promise.all([
        filesService.uploadImage(file),
        readImageDimensions(file).catch(() => ({
          width: undefined as number | undefined,
          height: undefined as number | undefined,
        })),
      ]);

      const message = await sendDisputeMessage(roomId, {
        url,
        mimeType: file.type,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
      });
      applyDisputeMessageToCache(queryClient, roomId, message, {
        orderId: detail?.room.orderId,
        ticketId: detail?.room.ticketId,
      });
    } catch (err) {
      sendErrorToast(err, t);
      throw err;
    } finally {
      setIsSending(false);
    }
  }

  if (!detail && isLoading) {
    return (
      <div className={cn('flex justify-center py-8', className)}>
        <Spinner />
      </div>
    );
  }

  if (!detail && isError) {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="text-sm text-muted-foreground">{t('loadError')}</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (!detail) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('loadError')}
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t('participants')}:{' '}
          {detail.participants.length > 0
            ? detail.participants.map((p) => `@${p.username}`).join(', ')
            : '—'}
        </p>
        {closed ? (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {t('closed')}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-[280px] max-h-[min(70vh,36rem)] flex-col overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
        <div className="min-h-0 flex-1 overflow-y-auto py-3">
          {sortedMessages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t('empty')}
            </p>
          ) : (
            sortedMessages.map((message) => (
              <DisputeMessageBubble
                key={message.id}
                message={message}
                isOwn={Boolean(
                  user?.id &&
                    message.authorId &&
                    message.authorId === user.id,
                )}
                locale={locale}
                enlargeLabel={tChat('thread.enlargeImage')}
                closeLightboxLabel={tChat('thread.closeImage')}
                t={t}
              />
            ))
          )}
        </div>

        {!closed ? (
          staffReplyLock === 'claim' ? (
            <p className="shrink-0 border-t border-border px-4 py-3 text-sm text-muted-foreground">
              {t('staffClaimRequired')}
            </p>
          ) : (
            <div className="shrink-0 border-t border-border">
              <MessageComposer
                disabled={closed}
                isSending={isSending}
                onSendText={handleSendText}
                onSendImage={handleSendImage}
              />
            </div>
          )
        ) : (
          <p className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            {t('closedHint')}
          </p>
        )}
      </div>
    </div>
  );
}
