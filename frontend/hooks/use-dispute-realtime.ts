'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  acquireChatSocket,
  CHAT_WS_EVENTS,
  getChatSocket,
  releaseChatSocket,
} from '@/lib/chat-socket';
import { moderationKeys, moderationService } from '@/services/moderation.service';
import { orderKeys } from '@/services/orders.service';
import type {
  LotDisputeMessage,
  LotDisputeRoomDetail,
} from '@/types/moderation';
import type { OrderDetail, OrderStatus } from '@/types/order';

export type DisputeMessageNewPayload = {
  roomId: string;
  orderId?: string | null;
  ticketId?: string | null;
  roomStatus?: 'OPEN' | 'CLOSED';
  orderStatus?: OrderStatus;
  message: LotDisputeMessage;
};

export type SendDisputeMessagePayload = {
  body?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
};

function upsertDisputeMessage(
  prev: LotDisputeRoomDetail | undefined,
  payload: Pick<DisputeMessageNewPayload, 'message' | 'roomStatus'>,
): LotDisputeRoomDetail | undefined {
  if (!prev) {
    return prev;
  }

  if (prev.messages.some((item) => item.id === payload.message.id)) {
    if (!payload.roomStatus || prev.room.status === payload.roomStatus) {
      return prev;
    }
    return {
      ...prev,
      room: { ...prev.room, status: payload.roomStatus },
    };
  }

  return {
    ...prev,
    messages: [...prev.messages, payload.message],
    room: payload.roomStatus
      ? { ...prev.room, status: payload.roomStatus }
      : prev.room,
  };
}

export function applyDisputeMessageToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  roomId: string,
  message: LotDisputeMessage,
  meta?: { orderId?: string | null; ticketId?: string | null },
): void {
  const patch = { message } as const;

  queryClient.setQueryData<LotDisputeRoomDetail>(
    moderationKeys.lotDisputeRoom(roomId),
    (prev) => upsertDisputeMessage(prev, patch),
  );

  const cached = queryClient.getQueryData<LotDisputeRoomDetail>(
    moderationKeys.lotDisputeRoom(roomId),
  );
  const orderId = meta?.orderId ?? cached?.room.orderId ?? null;
  const ticketId = meta?.ticketId ?? cached?.room.ticketId ?? null;

  if (orderId) {
    queryClient.setQueryData<LotDisputeRoomDetail>(
      moderationKeys.orderDisputeRoom(orderId),
      (prev) => upsertDisputeMessage(prev, patch),
    );
  }

  if (ticketId) {
    queryClient.setQueryData<LotDisputeRoomDetail>(
      moderationKeys.ticketLotDispute(ticketId),
      (prev) => upsertDisputeMessage(prev, patch),
    );
  }
}

/**
 * Send via socket when connected; REST fallback otherwise (same as private chat).
 */
export async function sendDisputeMessage(
  roomId: string,
  payload: SendDisputeMessagePayload,
): Promise<LotDisputeMessage> {
  const socket = getChatSocket();

  if (!socket?.connected) {
    const data = await moderationService.addLotDisputeMessage(roomId, payload);
    return data.message;
  }

  return new Promise<LotDisputeMessage>((resolve, reject) => {
    socket
      .timeout(15_000)
      .emit(
        CHAT_WS_EVENTS.DISPUTE_MESSAGE_SEND,
        { roomId, ...payload },
        (
          err: Error | null,
          response: { message?: LotDisputeMessage } | undefined,
        ) => {
          if (err) {
            reject(err);
            return;
          }

          if (!response?.message) {
            reject(new Error('dispute_message_empty'));
            return;
          }

          resolve(response.message);
        },
      );
  });
}

/**
 * Patches open dispute-room + order caches over the shared /chat socket.
 */
export function useDisputeRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = acquireChatSocket();

    const handleMessage = (payload: DisputeMessageNewPayload) => {
      if (!payload?.roomId || !payload.message?.id) {
        return;
      }

      queryClient.setQueryData<LotDisputeRoomDetail>(
        moderationKeys.lotDisputeRoom(payload.roomId),
        (prev) => upsertDisputeMessage(prev, payload),
      );

      if (payload.orderId) {
        const orderRoomKey = moderationKeys.orderDisputeRoom(payload.orderId);
        const hadOrderRoom = Boolean(queryClient.getQueryData(orderRoomKey));

        queryClient.setQueryData<LotDisputeRoomDetail>(
          orderRoomKey,
          (prev) => upsertDisputeMessage(prev, payload),
        );

        // First event after open: fetch full room (participants + history).
        if (!hadOrderRoom) {
          void queryClient.invalidateQueries({ queryKey: orderRoomKey });
        }

        if (payload.orderStatus) {
          queryClient.setQueryData<OrderDetail>(
            orderKeys.detail(payload.orderId),
            (prev) =>
              prev ? { ...prev, status: payload.orderStatus! } : prev,
          );
          void queryClient.invalidateQueries({
            queryKey: orderKeys.lists(),
          });
        }
      }

      if (payload.ticketId) {
        const ticketKey = moderationKeys.ticketLotDispute(payload.ticketId);
        const hadTicketRoom = Boolean(queryClient.getQueryData(ticketKey));

        queryClient.setQueryData<LotDisputeRoomDetail>(
          ticketKey,
          (prev) => upsertDisputeMessage(prev, payload),
        );

        if (!hadTicketRoom) {
          void queryClient.invalidateQueries({ queryKey: ticketKey });
        }
      }
    };

    socket.on(CHAT_WS_EVENTS.DISPUTE_MESSAGE_NEW, handleMessage);

    return () => {
      socket.off(CHAT_WS_EVENTS.DISPUTE_MESSAGE_NEW, handleMessage);
      releaseChatSocket();
    };
  }, [enabled, queryClient]);
}
