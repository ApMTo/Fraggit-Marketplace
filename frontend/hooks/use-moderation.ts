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
    }),
    createTicket: useMutation({
      mutationFn: (payload: CreateTicketPayload) =>
        moderationService.createTicket(payload),
      onSuccess: () => {
        invalidateAll();
        invalidateOrders();
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
        payload: { status?: TicketStatus; reason: string };
      }) => moderationService.updateTicket(id, payload),
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
  };
}
