'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  acquireChatSocket,
  CHAT_WS_EVENTS,
  releaseChatSocket,
} from '@/lib/chat-socket';
import { listingKeys } from '@/services/listings.service';
import { moderationKeys } from '@/services/moderation.service';
import type { LotDetail, LotListItem, LotStatus } from '@/types/lot';

export type LotStatusUpdatePayload = {
  lotId: string;
  status: LotStatus;
  sellerId: string;
};

function applyLotStatusToCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: LotStatusUpdatePayload,
) {
  queryClient.setQueryData<LotDetail>(
    listingKeys.detail(payload.lotId),
    (prev) => {
      if (!prev || prev.status === payload.status) {
        return prev;
      }
      return { ...prev, status: payload.status };
    },
  );

  const patchList = (prev: { items: LotListItem[] } | undefined) => {
    if (!prev?.items) {
      return prev;
    }

    let changed = false;
    const items = prev.items.map((item) => {
      if (item.id !== payload.lotId || item.status === payload.status) {
        return item;
      }
      changed = true;
      return { ...item, status: payload.status };
    });

    return changed ? { ...prev, items } : prev;
  };

  queryClient.setQueriesData<{ items: LotListItem[] }>(
    { queryKey: listingKeys.lists() },
    patchList,
  );

  queryClient.setQueriesData<{ items: LotListItem[] }>(
    { queryKey: listingKeys.sellerLists() },
    patchList,
  );

  queryClient.setQueriesData<{
    items: Array<{ id: string; status: LotStatus }>;
  }>({ queryKey: [...moderationKeys.all, 'lots'] }, (prev) => {
    if (!prev?.items) {
      return prev;
    }

    let changed = false;
    const items = prev.items.map((item) => {
      if (item.id !== payload.lotId || item.status === payload.status) {
        return item;
      }
      changed = true;
      return { ...item, status: payload.status };
    });

    return changed ? { ...prev, items } : prev;
  });
}

export function useLotStatusRealtime(lotId: string | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !lotId) {
      return;
    }

    const socket = acquireChatSocket();

    const subscribe = () => {
      socket.emit(CHAT_WS_EVENTS.LOT_SUBSCRIBE, { lotId });
    };

    socket.on('connect', subscribe);

    if (socket.connected) {
      subscribe();
    }

    return () => {
      socket.off('connect', subscribe);
      if (socket.connected) {
        socket.emit(CHAT_WS_EVENTS.LOT_UNSUBSCRIBE, { lotId });
      }
      releaseChatSocket();
    };
  }, [enabled, lotId]);
}

/**
 * Single global listener for lot:status:update. Mount once (notifications bell).
 */
export function useLotStatusRealtimeGlobal(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = acquireChatSocket();

    const handleStatusUpdate = (payload: LotStatusUpdatePayload) => {
      if (!payload?.lotId || !payload.status) {
        return;
      }
      applyLotStatusToCaches(queryClient, payload);
    };

    socket.on(CHAT_WS_EVENTS.LOT_STATUS_UPDATE, handleStatusUpdate);

    return () => {
      socket.off(CHAT_WS_EVENTS.LOT_STATUS_UPDATE, handleStatusUpdate);
      releaseChatSocket();
    };
  }, [enabled, queryClient]);
}
