export const CHAT_QUEUE = 'chat';
export const CHAT_JOB_NOTIFY_OFFLINE = 'notify-offline';
export const CHAT_JOB_NOTIFY_OFFLINE_ORDER = 'notify-offline-order';

export const CHAT_ONLINE_KEY_PREFIX = 'chat:online:';
export const CHAT_ONLINE_TTL_SECONDS = 60;
export const CHAT_HEARTBEAT_INTERVAL_MS = 30_000;

export const CHAT_RATE_LIMIT_KEY_PREFIX = 'chat:rate:';
export const CHAT_RATE_LIMIT_MAX_MESSAGES = 30;
export const CHAT_RATE_LIMIT_WINDOW_SECONDS = 60;

export const CHAT_MAX_TEXT_LENGTH = 2000;

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

export const CHAT_SYSTEM_EVENT = {
  ORDER_CREATED: 'order_created',
  ORDER_CREDENTIALS: 'order_credentials',
  ORDER_SERVICE_COMPLETED: 'order_service_completed',
  ORDER_APPROVED: 'order_approved',
} as const;

export type ChatNotifyOfflineJobData = {
  recipientUserId: string;
  recipientEmail: string;
  senderDisplayName: string;
  conversationId: string;
  messagePreview: string;
};

export type OrderNotifyOfflineJobData = {
  recipientUserId: string;
  recipientEmail: string;
  subject: string;
  title: string;
  body: string;
  href: string;
};
