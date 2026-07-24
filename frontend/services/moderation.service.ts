import api from '@/lib/api';
import type {
  CreateReportPayload,
  CreateTicketPayload,
  ModAuditAction,
  ModLot,
  ModOverview,
  ModReport,
  ModTicket,
  ModUser,
  ModUserDetail,
  ModerationReasonPayload,
  ModerationTargetType,
  Paginated,
  ReportStatus,
  TicketResolution,
  TicketStatus,
  UpdateUserStatusPayload,
} from '@/types/moderation';
import type { UserRole } from '@/types/auth';
import type { UserStatus } from '@/types/user';
import type { LotStatus } from '@/types/moderation';

export const moderationKeys = {
  all: ['moderation'] as const,
  overview: () => [...moderationKeys.all, 'overview'] as const,
  users: (params: Record<string, unknown>) =>
    [...moderationKeys.all, 'users', params] as const,
  user: (id: string) => [...moderationKeys.all, 'user', id] as const,
  lots: (params: Record<string, unknown>) =>
    [...moderationKeys.all, 'lots', params] as const,
  reports: (params: Record<string, unknown>) =>
    [...moderationKeys.all, 'reports', params] as const,
  tickets: (params: Record<string, unknown>) =>
    [...moderationKeys.all, 'tickets', params] as const,
  ticket: (id: string) => [...moderationKeys.all, 'ticket', id] as const,
  audit: (params: Record<string, unknown>) =>
    [...moderationKeys.all, 'audit', params] as const,
};

export const moderationService = {
  async getOverview(): Promise<ModOverview> {
    const { data } = await api.get<ModOverview>('/moderation/overview');
    return data;
  },

  async getUsers(params: {
    search?: string;
    status?: UserStatus;
    role?: UserRole;
    page?: number;
    limit?: number;
  }): Promise<Paginated<ModUser>> {
    const { data } = await api.get<Paginated<ModUser>>('/moderation/users', {
      params,
    });
    return data;
  },

  async getUser(id: string): Promise<ModUserDetail> {
    const { data } = await api.get<ModUserDetail>(`/moderation/users/${id}`);
    return data;
  },

  async updateUserStatus(id: string, payload: UpdateUserStatusPayload) {
    const { data } = await api.patch<{ user: ModUser; lotsRemoved: number }>(
      `/moderation/users/${id}/status`,
      payload,
    );
    return data;
  },

  async revokeSessions(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post<{ revokedSessions: number }>(
      `/moderation/users/${id}/sessions/revoke`,
      payload,
    );
    return data;
  },

  async resetTwoFactor(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post<{ user: ModUser }>(
      `/moderation/users/${id}/security/reset-2fa`,
      payload,
    );
    return data;
  },

  async updateUserRole(
    id: string,
    payload: { role: UserRole; reason: string },
  ) {
    const { data } = await api.patch<{ user: ModUser }>(
      `/moderation/users/${id}/role`,
      payload,
    );
    return data;
  },

  async getLots(params: {
    search?: string;
    status?: LotStatus;
    sellerId?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<ModLot>> {
    const { data } = await api.get<Paginated<ModLot>>('/moderation/lots', {
      params,
    });
    return data;
  },

  async removeLot(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post<{ lot: ModLot }>(
      `/moderation/lots/${id}/remove`,
      payload,
    );
    return data;
  },

  async restoreLot(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post<{ lot: ModLot }>(
      `/moderation/lots/${id}/restore`,
      payload,
    );
    return data;
  },

  async underReviewLot(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post<{ lot: ModLot }>(
      `/moderation/lots/${id}/under-review`,
      payload,
    );
    return data;
  },

  async hideReview(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post(`/moderation/reviews/${id}/hide`, payload);
    return data;
  },

  async unhideReview(id: string, payload: ModerationReasonPayload) {
    const { data } = await api.post(
      `/moderation/reviews/${id}/unhide`,
      payload,
    );
    return data;
  },

  async createReport(payload: CreateReportPayload): Promise<ModReport> {
    const { data } = await api.post<ModReport>('/moderation/reports', payload);
    return data;
  },

  async createTicket(payload: CreateTicketPayload): Promise<{ ticket: ModTicket }> {
    const { data } = await api.post<{ ticket: ModTicket }>(
      '/moderation/tickets',
      payload,
    );
    return data;
  },

  async getReports(params: {
    status?: ReportStatus;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<ModReport>> {
    const { data } = await api.get<Paginated<ModReport>>(
      '/moderation/reports',
      { params },
    );
    return data;
  },

  async updateReport(
    id: string,
    payload: {
      status?: ReportStatus;
      assignedToId?: string | null;
      resolutionNote?: string;
      reason: string;
    },
  ) {
    const { data } = await api.patch<{ report: ModReport }>(
      `/moderation/reports/${id}`,
      payload,
    );
    return data;
  },

  async getTickets(params: {
    status?: TicketStatus;
    page?: number;
    limit?: number;
  }): Promise<Paginated<ModTicket>> {
    const { data } = await api.get<Paginated<ModTicket>>(
      '/moderation/tickets',
      { params },
    );
    return data;
  },

  async getTicket(id: string) {
    const { data } = await api.get(`/moderation/tickets/${id}`);
    return data;
  },

  async updateTicket(
    id: string,
    payload: {
      status?: TicketStatus;
      reason: string;
      assigneeId?: string | null;
    },
  ) {
    const { data } = await api.patch<{ ticket: ModTicket }>(
      `/moderation/tickets/${id}`,
      payload,
    );
    return data;
  },

  async resolveTicket(
    id: string,
    payload: {
      resolution: TicketResolution;
      resolutionNote?: string;
      reason: string;
    },
  ) {
    const { data } = await api.post<{ ticket: ModTicket }>(
      `/moderation/tickets/${id}/resolve`,
      payload,
    );
    return data;
  },

  async addTicketMessage(
    id: string,
    payload: { body: string; isInternal?: boolean },
  ) {
    const { data } = await api.post(`/moderation/tickets/${id}/messages`, payload);
    return data;
  },

  async getAudit(params: {
    targetType?: ModerationTargetType;
    targetId?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<ModAuditAction>> {
    const { data } = await api.get<Paginated<ModAuditAction>>(
      '/moderation/audit',
      { params },
    );
    return data;
  },
};
