import api from '@/lib/api';
import type {
  CreateReportPayload,
  CreateTicketPayload,
  ModAuditAction,
  ModLot,
  ModOverview,
  ModReport,
  ModReportedConversation,
  LotDisputeRoomDetail,
  ModTicket,
  ModUser,
  ModUserDetail,
  ModUserReportConversationSummary,
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
  myReports: (params: Record<string, unknown>) =>
    [...moderationKeys.all, 'my-reports', params] as const,
  /**
   * Deliberately outside `all`: every fetch writes a CHAT_VIEW audit entry, so
   * blanket invalidation after moderation actions must not refetch it.
   */
  reportConversation: (id: string) =>
    ['moderation-report-conversation', id] as const,
  userReportConversations: (reportId: string) =>
    ['moderation-user-report-conversations', reportId] as const,
  userReportConversation: (reportId: string, conversationId: string) =>
    ['moderation-user-report-conversation', reportId, conversationId] as const,
  lotDisputeRoom: (roomId: string) =>
    [...moderationKeys.all, 'lot-dispute-room', roomId] as const,
  orderDisputeRoom: (orderId: string) =>
    [...moderationKeys.all, 'order-dispute-room', orderId] as const,
  ticketLotDispute: (ticketId: string) =>
    [...moderationKeys.all, 'ticket-lot-dispute', ticketId] as const,
  ticketConversation: (ticketId: string) =>
    ['moderation-ticket-conversation', ticketId] as const,
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

  async getMyReports(params: {
    status?: ReportStatus;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<ModReport>> {
    const { data } = await api.get<Paginated<ModReport>>(
      '/moderation/reports/mine',
      { params },
    );
    return data;
  },

  async getReportConversation(id: string): Promise<ModReportedConversation> {
    const { data } = await api.get<ModReportedConversation>(
      `/moderation/reports/${id}/conversation`,
    );
    return data;
  },

  async listUserReportConversations(reportId: string) {
    const { data } = await api.get<{
      items: ModUserReportConversationSummary[];
    }>(`/moderation/reports/${reportId}/user-conversations`);
    return data;
  },

  async getUserReportConversation(
    reportId: string,
    conversationId: string,
    params?: { context?: number },
  ): Promise<ModReportedConversation> {
    const { data } = await api.get<ModReportedConversation>(
      `/moderation/reports/${reportId}/user-conversations/${conversationId}`,
      { params },
    );
    return data;
  },

  async requestReportVerdict(id: string, summary: string) {
    const { data } = await api.post<{ report: ModReport }>(
      `/moderation/reports/${id}/request-verdict`,
      { summary },
    );
    return data;
  },

  async getLotDisputeRoom(
    roomId: string,
    params?: { limit?: number },
  ): Promise<LotDisputeRoomDetail> {
    const { data } = await api.get<LotDisputeRoomDetail>(
      `/moderation/lot-disputes/${roomId}`,
      { params },
    );
    return data;
  },

  async getOrderDisputeRoom(
    orderId: string,
  ): Promise<LotDisputeRoomDetail | (Omit<LotDisputeRoomDetail, 'room'> & { room: null })> {
    const { data } = await api.get<
      LotDisputeRoomDetail | (Omit<LotDisputeRoomDetail, 'room'> & { room: null })
    >(`/moderation/lot-disputes/order/${orderId}`);
    return data;
  },

  async getTicketLotDispute(
    ticketId: string,
    params?: { limit?: number },
  ): Promise<LotDisputeRoomDetail> {
    const { data } = await api.get<LotDisputeRoomDetail>(
      `/moderation/tickets/${ticketId}/lot-dispute`,
      { params },
    );
    return data;
  },

  async getTicketConversation(
    ticketId: string,
  ): Promise<ModReportedConversation> {
    const { data } = await api.get<ModReportedConversation>(
      `/moderation/tickets/${ticketId}/conversation`,
    );
    return data;
  },

  async addLotDisputeMessage(roomId: string, body: string) {
    const { data } = await api.post<{ message: LotDisputeRoomDetail['messages'][number] }>(
      `/moderation/lot-disputes/${roomId}/messages`,
      { body },
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

  async claimTicket(id: string) {
    const { data } = await api.post<{ ticket: ModTicket }>(
      `/moderation/tickets/${id}/claim`,
    );
    return data;
  },

  async requestTicketVerdict(id: string, payload: { summary: string }) {
    const { data } = await api.post<{ ticket: ModTicket }>(
      `/moderation/tickets/${id}/request-verdict`,
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
