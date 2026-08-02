import { io, type Socket } from 'socket.io-client';
import api from '@/lib/api';

export const CHAT_WS_EVENTS = {
  HEARTBEAT: 'heartbeat',
  MESSAGE_SEND: 'message:send',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_READ_ACK: 'message:read:ack',
  PRESENCE_UPDATE: 'presence:update',
  NOTIFICATION_NEW: 'notification:new',
  ERROR: 'error',
} as const;

const HEARTBEAT_INTERVAL_MS = 30_000;

function getChatSocketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '');
  if (fromEnv) {
    return fromEnv;
  }

  return 'http://localhost:3001';
}

async function fetchWsToken(): Promise<string> {
  const result = await api.get<{ token: string }>('/auth/ws-token');
  if (!result?.token) {
    throw new Error('chat_ws_token_missing');
  }
  return result.token;
}

let socket: Socket | null = null;
let subscriberCount = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function startHeartbeat(activeSocket: Socket): void {
  if (heartbeatTimer) {
    return;
  }

  heartbeatTimer = setInterval(() => {
    if (activeSocket.connected) {
      activeSocket.emit(CHAT_WS_EVENTS.HEARTBEAT);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat(): void {
  if (!heartbeatTimer) {
    return;
  }

  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

export function acquireChatSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Chat socket is client-only');
  }

  if (!socket) {
    socket = io(`${getChatSocketUrl()}/chat`, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      auth: (cb) => {
        void fetchWsToken()
          .then((token) => cb({ token }))
          .catch((error: unknown) => {
            cb(error instanceof Error ? error : new Error(String(error)));
          });
      },
    });
  }

  subscriberCount += 1;

  if (!socket.connected) {
    socket.connect();
  }

  startHeartbeat(socket);

  return socket;
}

export function releaseChatSocket(): void {
  subscriberCount = Math.max(0, subscriberCount - 1);

  if (subscriberCount > 0 || !socket) {
    return;
  }

  stopHeartbeat();
  socket.disconnect();
}

export function getChatSocket(): Socket | null {
  return socket;
}
