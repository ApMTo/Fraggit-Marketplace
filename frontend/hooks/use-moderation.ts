'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  moderationKeys,
  moderationService,
} from '@/services/moderation.service';
import { orderKeys } from '@/services/orders.service';
import type {
  CreateReportPayload,
  CreateTicketPayload,
  LotStatus,
  ModerationReasonPayload,
  ModerationTargetType,
  ReportStatus,
  TicketResolution,
  TicketStatus,
  UpdateUserStatusPayload,
} from '@/types/moderation';
import type { UserRole } from '@/types/auth';
import type { UserStatus } from '@/types/user';

export function useModOverview() {
  return useQuery({
    queryKey: moderationKeys.overview(),
    queryFn: () => moderationService.getOverview(),
  });
}

export function useModUsers(params: {
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: moderationKeys.users(params),
    queryFn: () => moderationService.getUsers(params),
  });
}

export function useModUser(id: string | null) {
  return useQuery({
    queryKey: moderationKeys.user(id ?? ''),
    queryFn: () => moderationService.getUser(id!),
    enabled: Boolean(id),
  });
}

export function useModLots(params: {
  search?: string;
  status?: LotStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: moderationKeys.lots(params),
    queryFn: () => moderationService.getLots(params),
  });
}

export function useModReports(params: {
  status?: ReportStatus;
  targetType?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: moderationKeys.reports(params),
    queryFn: () => moderationService.getReports(params),
  });
}

export function useMyReports(params: {
  status?: ReportStatus;
  targetType?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
} = {}) {
  const { enabled = true, ...query } = params;
  return useQuery({
    queryKey: moderationKeys.myReports(query),
    queryFn: () => moderationService.getMyReports(query),
    enabled,
  });
}

/** Each successful load is written to the moderation audit log. */
export function useReportConversation(reportId: string | null) {
  return useQuery({
    queryKey: moderationKeys.reportConversation(reportId ?? ''),
    queryFn: () => moderationService.getReportConversation(reportId!),
    enabled: Boolean(reportId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useUserReportConversations(reportId: string | null) {
  return useQuery({
    queryKey: moderationKeys.userReportConversations(reportId ?? ''),
    queryFn: () => moderationService.listUserReportConversations(reportId!),
    enabled: Boolean(reportId),
    staleTime: 60_000,
  });
}

export function useUserReportConversation(
  reportId: string | null,
  conversationId: string | null,
) {
  return useQuery({
    queryKey: moderationKeys.userReportConversation(
      reportId ?? '',
      conversationId ?? '',
    ),
    queryFn: () =>
      moderationService.getUserReportConversation(
        reportId!,
        conversationId!,
      ),
    enabled: Boolean(reportId && conversationId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useLotDisputeRoom(roomId: string | null) {
  return useQuery({
    queryKey: moderationKeys.lotDisputeRoom(roomId ?? ''),
    queryFn: () => moderationService.getLotDisputeRoom(roomId!),
    enabled: Boolean(roomId),
    refetchInterval: 10_000,
  });
}

export function useOrderDisputeRoom(orderId: string, enabled = true) {
  return useQuery({
    queryKey: moderationKeys.orderDisputeRoom(orderId),
    queryFn: () => moderationService.getOrderDisputeRoom(orderId),
    enabled: Boolean(orderId) && enabled,
    refetchInterval: 10_000,
  });
}

export function useTicketLotDispute(ticketId: string | null) {
  return useQuery({
    queryKey: moderationKeys.ticketLotDispute(ticketId ?? ''),
    queryFn: () => moderationService.getTicketLotDispute(ticketId!),
    enabled: Boolean(ticketId),
    refetchInterval: 10_000,
  });
}

/** ADMIN+ only. Each fetch is audited as CHAT_VIEW. */
export function useTicketConversation(ticketId: string | null) {
  return useQuery({
    queryKey: moderationKeys.ticketConversation(ticketId ?? ''),
    queryFn: () => moderationService.getTicketConversation(ticketId!),
    enabled: Boolean(ticketId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useModTickets(params: {
  status?: TicketStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: moderationKeys.tickets(params),
    queryFn: () => moderationService.getTickets(params),
  });
}

export function useModTicket(id: string | null) {
  return useQuery({
    queryKey: moderationKeys.ticket(id ?? ''),
    queryFn: () => moderationService.getTicket(id!),
    enabled: Boolean(id),
  });
}

export function useModAudit(params: {
  targetType?: ModerationTargetType;
  targetId?: string;
  actorId?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...query } = params;
  return useQuery({
    queryKey: moderationKeys.audit(query),
    queryFn: () => moderationService.getAudit(query),
    enabled,
  });
}

export function useModerationMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () =>
    void queryClient.invalidateQueries({ queryKey: moderationKeys.all });

  const invalidateOrders = () =>
    void queryClient.invalidateQueries({ queryKey: orderKeys.all });

  return {
    updateUserStatus: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateUserStatusPayload;
      }) => moderationService.updateUserStatus(id, payload),
      onSuccess: invalidateAll,
    }),
    revokeSessions: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ModerationReasonPayload;
      }) => moderationService.revokeSessions(id, payload),
      onSuccess: invalidateAll,
    }),
    resetTwoFactor: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ModerationReasonPayload;
      }) => moderationService.resetTwoFactor(id, payload),
      onSuccess: invalidateAll,
    }),
    updateUserRole: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { role: UserRole; reason: string };
      }) => moderationService.updateUserRole(id, payload),
      onSuccess: invalidateAll,
    }),
    removeLot: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ModerationReasonPayload;
      }) => moderationService.removeLot(id, payload),
      onSuccess: invalidateAll,
    }),
    restoreLot: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ModerationReasonPayload;
      }) => moderationService.restoreLot(id, payload),
      onSuccess: invalidateAll,
    }),
    underReviewLot: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ModerationReasonPayload;
      }) => moderationService.underReviewLot(id, payload),
      onSuccess: invalidateAll,
    }),
    createReport: useMutation({
      mutationFn: (payload: CreateReportPayload) =>
        moderationService.createReport(payload),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: moderationKeys.myReports({}) });
      },
    }),
    createTicket: useMutation({
      mutationFn: (payload: CreateTicketPayload) =>
        moderationService.createTicket(payload),
      onSuccess: (_data, variables) => {
        invalidateAll();
        invalidateOrders();
        if (variables.orderId) {
          void queryClient.invalidateQueries({
            queryKey: moderationKeys.orderDisputeRoom(variables.orderId),
          });
        }
      },
    }),
    updateReport: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: {
          status?: ReportStatus;
          assignedToId?: string | null;
          resolutionNote?: string;
          reason: string;
        };
      }) => moderationService.updateReport(id, payload),
      onSuccess: invalidateAll,
    }),
    updateTicket: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: {
          status?: TicketStatus;
          reason: string;
          assigneeId?: string | null;
        };
      }) => moderationService.updateTicket(id, payload),
      onSuccess: invalidateAll,
    }),
    claimTicket: useMutation({
      mutationFn: (id: string) => moderationService.claimTicket(id),
      onSuccess: (_data, ticketId) => {
        invalidateAll();
        void queryClient.invalidateQueries({
          queryKey: moderationKeys.ticket(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: moderationKeys.ticketLotDispute(ticketId),
        });
      },
    }),
    requestTicketVerdict: useMutation({
      mutationFn: ({
        id,
        summary,
      }: {
        id: string;
        summary: string;
      }) => moderationService.requestTicketVerdict(id, { summary }),
      onSuccess: (_data, { id }) => {
        invalidateAll();
        void queryClient.invalidateQueries({
          queryKey: moderationKeys.ticket(id),
        });
      },
    }),
    requestReportVerdict: useMutation({
      mutationFn: ({ id, summary }: { id: string; summary: string }) =>
        moderationService.requestReportVerdict(id, summary),
      onSuccess: invalidateAll,
    }),
    resolveTicket: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: {
          resolution: TicketResolution;
          resolutionNote?: string;
          reason: string;
        };
      }) => moderationService.resolveTicket(id, payload),
      onSuccess: () => {
        invalidateAll();
        invalidateOrders();
      },
    }),
    addTicketMessage: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { body: string; isInternal?: boolean };
      }) => moderationService.addTicketMessage(id, payload),
      onSuccess: invalidateAll,
    }),
    addLotDisputeMessage: useMutation({
      mutationFn: ({
        roomId,
        body,
      }: {
        roomId: string;
        body: string;
      }) => moderationService.addLotDisputeMessage(roomId, body),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          queryKey: moderationKeys.lotDisputeRoom(variables.roomId),
        });
        void queryClient.invalidateQueries({ queryKey: moderationKeys.all });
      },
    }),
  };
}
