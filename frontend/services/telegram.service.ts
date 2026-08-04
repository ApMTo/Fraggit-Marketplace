import api from '@/lib/api';

export type TelegramLinkStatus = {
  linked: boolean;
  telegramUsername: string | null;
  telegramLocale: 'en' | 'ru' | null;
};

export type TelegramLinkCodeResult = {
  deepLink: string;
  expiresInSeconds: number;
};

export type TelegramUnlinkResponse = {
  message: { code: string };
};

export const telegramKeys = {
  all: ['telegram'] as const,
  status: () => [...telegramKeys.all, 'status'] as const,
};

export const telegramService = {
  async getStatus(): Promise<TelegramLinkStatus> {
    const { data } = await api.get<TelegramLinkStatus>('/telegram/status');
    return data;
  },

  async createLink(): Promise<TelegramLinkCodeResult> {
    const { data } = await api.post<TelegramLinkCodeResult>('/telegram/link');
    return data;
  },

  async unlink(): Promise<TelegramUnlinkResponse> {
    const { data } = await api.delete<TelegramUnlinkResponse>('/telegram/link');
    return data;
  },
};
