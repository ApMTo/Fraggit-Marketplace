'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearConversationUnread,
  upsertConversationMessage,
} from '@/lib/chat-cache';
import {
  acquireChatSocket,
  CHAT_WS_EVENTS,
  getChatSocket,
  releaseChatSocket,
} from '@/lib/chat-socket';
import { playChatMessageSound } from '@/lib/chat-sound';
import { chatService } from '@/services/chat.service';
import type {
  ChatMessage,
  WsErrorPayload,
  WsMarkReadAckPayload,
  WsMessagePayload,
} from '@/types/chat';

type UseChatRealtimeOptions = {
  currentUserId: string | undefined;
  activeConversationId: string | null | undefined;
  enabled?: boolean;
  /** Play sound for incoming TEXT/IMAGE when not viewing that conversation. */
  alertSound?: boolean;
};

/**
 * Acquires the shared /chat socket while mounted and keeps React Query caches
 * in sync with server events. Send/read use the same socket instance.
 */
export function useChatRealtime({
  currentUserId,
  activeConversationId,
  enabled = true,
  alertSound = false,
}: UseChatRealtimeOptions) {
  const queryClient = useQueryClient();
  const activeConversationIdRef = useRef(activeConversationId);
  const currentUserIdRef = useRef(currentUserId);
  const alertSoundRef = useRef(alertSound);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
    currentUserIdRef.current = currentUserId;
    alertSoundRef.current = alertSound;
  }, [activeConversationId, currentUserId, alertSound]);

  useEffect(() => {
    if (!enabled || !currentUserId) {
      return;
    }

    const socket = acquireChatSocket();

    const applyMessage = (payload: WsMessagePayload) => {
      const message = payload?.message;
      if (!message?.id || !message.conversationId) {
        return;
      }

      upsertConversationMessage(queryClient, message, {
        currentUserId: currentUserIdRef.current,
        activeConversationId: activeConversationIdRef.current,
      });
    };

    const handleIncomingMessage = (payload: WsMessagePayload) => {
      const message = payload?.message;
      if (!message?.id || !message.conversationId) {
        return;
      }

      applyMessage(payload);

      if (!alertSoundRef.current) {
        return;
      }

      const isOwn =
        Boolean(message.senderId) &&
        message.senderId === currentUserIdRef.current;
      const isActive =
        message.conversationId === activeConversationIdRef.current;
      const isUserMessage =
        message.type === 'TEXT' || message.type === 'IMAGE';

      if (!isOwn && !isActive && isUserMessage) {
        playChatMessageSound();
      }
    };

    const handleReadAck = (payload: WsMarkReadAckPayload) => {
      if (!payload?.conversationId) {
        return;
      }

      if (
        !payload.readerUserId ||
        payload.readerUserId === currentUserIdRef.current
      ) {
        clearConversationUnread(queryClient, payload.conversationId);
      }
    };

    const handleError = (payload: WsErrorPayload) => {
      if (payload?.code === 'chat_auth_failed') {
        void queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    };

    socket.on(CHAT_WS_EVENTS.MESSAGE_NEW, handleIncomingMessage);
    socket.on(CHAT_WS_EVENTS.MESSAGE_SENT, applyMessage);
    socket.on(CHAT_WS_EVENTS.MESSAGE_READ_ACK, handleReadAck);
    socket.on(CHAT_WS_EVENTS.ERROR, handleError);

    return () => {
      socket.off(CHAT_WS_EVENTS.MESSAGE_NEW, handleIncomingMessage);
      socket.off(CHAT_WS_EVENTS.MESSAGE_SENT, applyMessage);
      socket.off(CHAT_WS_EVENTS.MESSAGE_READ_ACK, handleReadAck);
      socket.off(CHAT_WS_EVENTS.ERROR, handleError);
      releaseChatSocket();
    };
  }, [enabled, currentUserId, queryClient]);
}

export async function sendChatTextMessage(
  conversationId: string,
  content: string,
): Promise<ChatMessage> {
  const socket = getChatSocket();

  if (!socket?.connected) {
    return chatService.sendTextMessage(conversationId, content);
  }

  return new Promise<ChatMessage>((resolve, reject) => {
    socket
      .timeout(15_000)
      .emit(
        CHAT_WS_EVENTS.MESSAGE_SEND,
        { conversationId, content },
        (err: Error | null, response: WsMessagePayload) => {
          if (err) {
            reject(err);
            return;
          }

          if (!response?.message) {
            reject(new Error('chat_message_empty'));
            return;
          }

          resolve(response.message);
        },
      );
  });
}

export function emitChatMarkRead(
  conversationId: string,
  lastReadMessageId: string,
): void {
  const socket = getChatSocket();

  if (socket?.connected) {
    socket.emit(CHAT_WS_EVENTS.MESSAGE_READ, {
      conversationId,
      lastReadMessageId,
    });
    return;
  }

  void chatService.markAsRead(conversationId, lastReadMessageId);
}
