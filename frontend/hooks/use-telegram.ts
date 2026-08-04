'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  telegramKeys,
  telegramService,
} from '@/services/telegram.service';

export function useTelegramStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: telegramKeys.status(),
    queryFn: () => telegramService.getStatus(),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateTelegramLink() {
  return useMutation({
    mutationFn: () => telegramService.createLink(),
  });
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => telegramService.unlink(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: telegramKeys.status() });
    },
  });
}
