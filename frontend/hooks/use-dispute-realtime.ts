'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  acquireChatSocket,
  CHAT_WS_EVENTS,
  releaseChatSocket,
} from '@/lib/chat-socket';
import { moderationKeys } from '@/services/moderation.service';
import type {
  LotDisputeMessage,
  LotDisputeRoomDetail,
} from '@/types/moderation';

export type DisputeMessageNewPayload = {
  roomId: string;
  orderId?: string | null;
  ticketId?: string | null;
  roomStatus?: 'OPEN' | 'CLOSED';
  message: LotDisputeMessage;
};

function upsertDisputeMessage(
  prev: LotDisputeRoomDetail | undefined,
  payload: DisputeMessageNewPayload,
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
        queryClient.setQueryData<LotDisputeRoomDetail>(
          moderationKeys.orderDisputeRoom(payload.orderId),
          (prev) => upsertDisputeMessage(prev, payload),
        );
      }

      if (payload.ticketId) {
        queryClient.setQueryData<LotDisputeRoomDetail>(
          moderationKeys.ticketLotDispute(payload.ticketId),
          (prev) => upsertDisputeMessage(prev, payload),
        );
      }
    };

    socket.on(CHAT_WS_EVENTS.DISPUTE_MESSAGE_NEW, handleMessage);

    return () => {
      socket.off(CHAT_WS_EVENTS.DISPUTE_MESSAGE_NEW, handleMessage);
      releaseChatSocket();
    };
  }, [enabled, queryClient]);
}
