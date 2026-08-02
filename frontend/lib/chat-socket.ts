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
  LOT_SUBSCRIBE: 'lot:subscribe',
  LOT_UNSUBSCRIBE: 'lot:unsubscribe',
  LOT_STATUS_UPDATE: 'lot:status:update',
  DISPUTE_MESSAGE_NEW: 'dispute:message:new',
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
  const { data } = await api.get<{ token: string }>('/auth/ws-token');
  if (!data?.token) {
    throw new Error('chat_ws_token_missing');
  }
  return data.token;
}

let socket: Socket | null = null;
let subscriberCount = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let connectInFlight: Promise<void> | null = null;

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

function ensureSocket(): Socket {
  if (socket) {
    return socket;
  }

  socket = io(`${getChatSocketUrl()}/chat`, {
    withCredentials: true,
    autoConnect: false,
    // Polling first so the auth handshake is reliable behind proxies.
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  socket.on('reconnect_attempt', () => {
    void fetchWsToken()
      .then((token) => {
        if (socket) {
          socket.auth = { token };
        }
      })
      .catch(() => {
        // Next attempt will retry token fetch.
      });
  });

  return socket;
}

async function connectSocket(activeSocket: Socket): Promise<void> {
  if (activeSocket.connected) {
    return;
  }

  if (connectInFlight) {
    await connectInFlight;
    return;
  }

  connectInFlight = (async () => {
    const token = await fetchWsToken();
    activeSocket.auth = { token };
    if (!activeSocket.connected) {
      activeSocket.connect();
    }
  })().finally(() => {
    connectInFlight = null;
  });

  await connectInFlight;
}

export function acquireChatSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Chat socket is client-only');
  }

  const activeSocket = ensureSocket();
  subscriberCount += 1;

  void connectSocket(activeSocket).catch((error: unknown) => {
    console.error('[chat-socket] failed to authenticate/connect', error);
  });

  startHeartbeat(activeSocket);

  return activeSocket;
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
